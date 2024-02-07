import express from "express";
import path from "path";

import logger from "morgan";
import appRouter from "./routes/index.js";
import connectDB from "./config/connectDB.js"
import handlebars from "express-handlebars";
import __dirname, { uploader } from "./utils.js";
import { Server } from "socket.io";
import viewsRouter from "./routes/views.router.js" 
import productsModel from "./dao/models/products.model.js";
import messagesModel from "./dao/models/messages.model.js";

const app = express()
const PORT = process.env.PORT || 8080

connectDB()
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(logger('dev'));

app.engine('handlebars', handlebars.engine())
app.set("views", __dirname+ "/views")
app.set("view engine", "handlebars")
app.use('/', viewsRouter)

app.post("/upload", uploader.single('myFile'), (req, res)=> {
    res.send("imagen subida")
})

app.use(appRouter)


const httpServer = app.listen(PORT, (err) => {
    if(err) console.log(err)
    console.log(`Escuchando en el puerto ${PORT}`)
})

const io = new Server(httpServer)

let mensajes = []

io.on('connection', socket => {
    console.log("Cliente conectado")

    socket.on("addProduct",  async (productData) => {
       const newProduct = await productsModel.create(productData)
        const productList = await productsModel.find()
        io.emit('productsList', productList)
    })

    socket.on("deleteProduct", async (productId) => {
        const productDeleted = await productsModel.findOneAndDelete(productId)
        const productList = await productsModel.find()
        io.emit('productsList', productList)
    })

    socket.on("message1", (data) => {
        console.log(data)
    })

    socket.on('message', async (data) => {
        mensajes.push(data)
        io.emit('messageLogs', mensajes)
        const { email, message } = await data
        const updatedMessages = await messagesModel.findOne({user: email})
        if (!updatedMessages){
            const newUserMessages = await messagesModel.create({user: email, message})
            console.log("Nuevo usuario creado:", newUserMessages.user)
            return
        }
        let newMessage;
        try {
            newMessage = JSON.parse(updatedMessages.message);
        } catch (error) {
            newMessage = updatedMessages.message;
        }

        updatedMessages.message = message + "\n" + newMessage
        console.log("Mensaje Nuevo: ", updatedMessages)

        const result = await updatedMessages.save()

    })
})