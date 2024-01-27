//lado cliente
const socket = io(); 

socket.emit("message", "hola desde el cliente");
socket.on("para-todos", data => {
    console.log(data);
})

 