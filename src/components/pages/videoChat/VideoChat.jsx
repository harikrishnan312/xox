import React, { useEffect, useRef, useState } from 'react'
import Peer from "simple-peer"

export default function VideoChat({ socket, opponent, user, id, setIsVideo }) {
    const [stream, setStream] = useState()
    const [receivingCall, setReceivingCall] = useState(false)
    const [caller, setCaller] = useState("")
    const [callerSignal, setCallerSignal] = useState()
    const [callAccepted, setCallAccepted] = useState(false)
    const [callEnded, setCallEnded] = useState(false);
    const myVideo = useRef()
    const userVideo = useRef()
    const connectionRef = useRef()

    useEffect(() => {

        navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((stream) => {
            setStream(stream)
            if (myVideo.current) {
                myVideo.current.srcObject = stream
            }
        })

        socket.on("callUser", (data) => {
            setReceivingCall(true)
            setCaller(data.from)
            setCallerSignal(data.signal)
        })
        socket.on("callEnd", () => {
            if (userVideo.current?.srcObject) {
                userVideo.current.srcObject = null
            }
            myVideo.current = null
            userVideo.current = null
            setCallEnded(true);
            setReceivingCall(false);
            setIsVideo(false)
            // setCallAccepted(false);
        })
        return (() => {

            myVideo.current = null
            userVideo.current = null
            setStream(null)
            if (connectionRef.current) {
                connectionRef.current.destroy();
                connectionRef.current = null
            }
        })
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
    const callUser = (id) => {
        try {
            const peer = new Peer({
                initiator: true,
                trickle: false,
                stream: stream
            })
            peer.on("signal", (data) => {
                socket.emit("callUser", {
                    userToCall: opponent,
                    signalData: data,
                    from: user,
                })
            })
            peer.on("stream", (stream) => {
                if (userVideo.current) {
                    userVideo.current.srcObject = stream
                }

            })
            socket.on("callAccepted", (signal) => {
                setCallAccepted(true)
                if (!peer.destroyed) {
                    peer.signal(signal)
                }
            })

            connectionRef.current = peer
        } catch (error) {
            console.log(error)
        }

    }
    const answerCall = () => {
        try {
            setCallAccepted(true)
            const peer = new Peer({
                initiator: false,
                trickle: false,
                stream: stream
            })
            peer.on("signal", (data) => {
                socket.emit("answerCall", { signal: data, to: caller })
            })
            peer.on("stream", (stream) => {
                if (userVideo.current) {
                    userVideo.current.srcObject = stream
                }
            })
            if (!peer.destroyed) {
                peer.signal(callerSignal)
            }
            connectionRef.current = peer
        } catch (error) {
            console.log(error)
        }

    }

    const leaveCall = () => {
        try {
            setCallEnded(true)
            myVideo.current = null
            userVideo.current = null
            socket.emit("callEnd", id)
            setReceivingCall(false)
            // setCallAccepted(false)
            setIsVideo(false)
            if (connectionRef.current) {
                connectionRef.current.destroy();
                connectionRef.current = null
            }
        } catch (error) {
            console.log(error)
        }

    }
    return (
        <div className="container">
            <div className="video-call-container" style={{ position: "relative", height: "50vh", alignItems: "center", justifyContent: "center", backgroundColor: "#f0f2f5", padding: '1em', display: 'flex', margin:'1em' }}>
                <div className="video-container" style={{ position: "relative", borderRadius: "10px", overflow: "hidden", boxShadow: "0px 4px 15px rgba(0, 0, 0, 0.2)", backgroundColor: "#000" }}>
                    <div className="my-video-container" style={{ position: "absolute", bottom: "10px", right: "10px", width: "150px", height: "100px", borderRadius: "10px", overflow: "hidden", border: "2px solid #fff" }}>
                        {stream && <video playsInline muted ref={myVideo} autoPlay style={{ width: "100%", height: "100%", objectFit: "cover", transform: "scaleX(-1)" }} />}
                    </div>
                    <div style={{ width: "300px", height: "250px" }}>
                        {callAccepted && !callEnded ? (
                            <video playsInline ref={userVideo} autoPlay style={{ width: "100%", height: "100%", objectFit: "cover", }} />
                        ) : (
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%", height: "100%", color: "#fff" }}>
                                Waiting for user to join...
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {<div style={{ display: 'flex', justifyContent: 'center', padding: '.4em' }}>
                {callAccepted && !callEnded ? (
                    <div>
                        <button style={{
                            backgroundColor: 'red',
                            border: 'none',
                            color: 'white',
                            padding: '8px 12px',
                            textAlign: 'center',
                            textDecoration: 'none',
                            display: 'inline-block',
                            margin: '4px 2px',
                            cursor: 'pointer',
                            borderRadius: '8px',
                            width: "10em",
                            fontSize: '1.3em'
                        }} variant="contained" color="secondary" onClick={leaveCall}>
                            Close Chat
                        </button>
                    </div>
                ) : (
                    !receivingCall && !callAccepted &&
                    < div > <button style={{
                        backgroundColor: 'green',
                        border: 'none',
                        color: 'white',
                        padding: '8px 12px',
                        textAlign: 'center',
                        textDecoration: 'none',
                        display: 'inline-block',
                        margin: '4px 2px',
                        cursor: 'pointer',
                        borderRadius: '8px',
                        width: "6em",
                        fontSize: '1.3em'
                    }} onClick={() => callUser(opponent)}>
                        Connect
                    </button>
                    </div>
                )}
            </div>}
            <div>
                {receivingCall && !callAccepted ? (
                    <div style={{ display: 'flex', justifyContent: "center" }}>
                        <button style={{
                            backgroundColor: 'green',
                            border: 'none',
                            color: 'white',
                            padding: '8px 15px',
                            textAlign: 'center',
                            textDecoration: 'none',
                            display: 'inline-block',
                            margin: '4px 2px',
                            cursor: 'pointer',
                            borderRadius: '8px',
                            width: "8em",
                            fontSize: '1.2em'
                        }}
                            onClick={answerCall}>
                            Join
                        </button>
                    </div>
                ) : null}
            </div>
        </div>
    )
}
