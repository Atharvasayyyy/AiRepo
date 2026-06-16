module.exports = (io) => {

    io.on("connection",(socket)=>{

        console.log(
            "User Connected",
            socket.id
        );

        socket.on(
            "join_workspace",
            (workspaceId)=>{

                socket.join(
                    `workspace_${workspaceId}`
                );

            }
        );

        socket.on(
            "leave_workspace",
            (workspaceId)=>{

                socket.leave(
                    `workspace_${workspaceId}`
                );

            }
        );

    });

};