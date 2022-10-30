import http from 'http'

export interface IncomingMessage extends http.IncomingMessage {
	startedAt: number
	serviceTitle: symbol
}
