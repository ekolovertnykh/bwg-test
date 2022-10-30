import express from 'express'

const app = express()

app.get('/', async (req, res) => {
	res.send(`Hello world!`)
})

function bootstrap(): void {
	app.listen(3000)
}

bootstrap()
