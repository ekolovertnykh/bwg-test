import http from 'http'
import proxy, { ServerOptions } from 'http-proxy'
import { IncomingMessage } from 'types/custom'
import client from './common/redis'
import logger from './common/logger'
import balancer from './common/balancer'

const httpAgent = new http.Agent({ keepAlive: true, maxSockets: 100 })
const proxyServer = proxy.createProxyServer()
proxyServer.on('proxyRes', proxyResponseHandler)
proxyServer.on('error', proxyResponseHandler)
proxyServer.on('econnreset', proxyResponseHandler)

function proxyResponseHandler(
	data: http.IncomingMessage | Error,
	req: IncomingMessage,
	res: http.ServerResponse
): void {
	writeLogs(data, req, res)
	balancer.releaseService(req.serviceTitle)
}

function writeLogs(
	err: http.IncomingMessage | Error,
	req: IncomingMessage,
	res: http.ServerResponse
): void {
	const ip = req.socket.remoteAddress
	const statusCode = res.statusCode
	// Проверяем, кем обработан запрос, каким-то сервисом или балансировщиком
	const title = req.serviceTitle ? Symbol.keyFor(req.serviceTitle) : 'balancer'
	const time = new Date().getTime() - req.startedAt
	const userAgent = req.headers['user-agent']
	const message = `[${title}] time: ${time}ms, ip: ${ip}, UA: ${userAgent}, status: ${statusCode}`
	if (err instanceof Error) {
		logger.error(message + `, err: ${err.message}, stack: ${err.stack}`)
	} else {
		//Если время обработки более 500мс, то уровень лога будет warn
		logger.log({
			level: time > 500 ? 'warn' : 'info',
			message: message
		})
	}
}

async function isUserRatelimited(ip: string): Promise<boolean> {
	/*
	 * Проверяем, есть ли в redis запись о данном ip. Если ее нет, то сразу же
	 * ставим значение 100. Если записи не было, также ставим ttl в 60 секунд
	 */
	if (await client.SETNX(ip, '100')) {
		await client.expire(ip, 60)
	}
	/*
	 * Получаем количество запросов, которое пользователь может сделать.
	 * Если число меньше или равно 0, то возвращаем true (пользователь исчерпал
	 * лимит запросов)
	 */
	const remainingRequests = Number(await client.get(ip))
	if (remainingRequests <= 0) {
		return true
	}
	/*
	 * Уменьшаем количество запросов, которое пользователь может сделать на 1
	 */
	await client.DECR(ip)
	return false
}

async function requestHandler(
	req: IncomingMessage,
	res: http.ServerResponse
): Promise<void> {
	/*
	 * Добавляем в объект входящего запроса дату начала обработки
	 */
	req.startedAt = new Date().getTime()
	/*
	 * Проверяем, может ли пользователь сделать запрос
	 */
	const isUserLimited = await isUserRatelimited(req.socket.remoteAddress)
	if (isUserLimited) {
		/* Возвращаем ошибку 429 в случае, если лимит запросов исчерпан */
		res.writeHead(429)
		res.end('You are being ratelimited!')
		writeLogs(null, req, res)
		return
	}
	/*
	 * Получаем сервис с наименьшим количеством активных подключений
	 */
	const service = balancer.getService()
	const options: ServerOptions = {
		target: service.url,
		proxyTimeout: 5000,
		timeout: 5000,
		agent: httpAgent
	}
	/*
	 * Добавляем в объект входящего запроса название сервиса, который будет
	 * обратывать запрос
	 */
	req.serviceTitle = service.title
	/*
	 * Перенаправляем запрос на выбранный сервис
	 */
	proxyServer.web(req, res, options)
}

balancer.addService('http://s1:3000/', 's1')
balancer.addService('http://s2:3000/', 's2')
balancer.addService('http://s3:3000/', 's3')
balancer.addService('http://s4:3000/', 's4')

http.createServer(requestHandler).listen(1000)
