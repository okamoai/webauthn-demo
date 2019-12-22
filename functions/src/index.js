import path from 'path'
import express from 'express'
import * as functions from 'firebase-functions'
import router from './router'

const app = express()

app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(express.static(path.join(__dirname, 'router')))
app.use('/', router)

exports.api = functions.https.onRequest(app)
