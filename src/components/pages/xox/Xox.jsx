import React, { useEffect, useRef, useState } from 'react';
import './Xox.css';
import useAuth from '../../../hooks/useAuth';
import io from "socket.io-client";
import Peer from "simple-peer"

let socket;
// const EndPoint = "http://localhost:3001"
const EndPoint = "https://xox-backend.onrender.com"

function GameBoard() {

    const { id, user } = useAuth();
    const [board, setBoard] = useState(Array(9).fill(null));
    const [isXNext, setIsXNext] = useState(true);
    const [turn, setTurn] = useState(true);
    const [yourMessage, setYourMessage] = useState("");
    const [oppMessage, setOppMessage] = useState("");
    const [message, setMessage] = useState("");
    const [opponent, setOpponent] = useState('');
    const [stream, setStream] = useState()
    const [receivingCall, setReceivingCall] = useState(false)
    const [caller, setCaller] = useState("")
    const [callerSignal, setCallerSignal] = useState()
    const [callAccepted, setCallAccepted] = useState(false)
    const [callEnded, setCallEnded] = useState(false);
    const [isVideo, setIsVideo] = useState(false)
    const myVideo = useRef()
    const userVideo = useRef()
    const connectionRef = useRef()

    useEffect(() => {

        socket = io(EndPoint);

        navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((stream) => {
            setStream(stream)

        })
        id.length > 0 && socket.emit("set up", id, user);

        socket.on('new_board', (newBoard, userid, isXNext) => {
            if (newBoard && userid !== user) {
                setBoard(newBoard);
                setIsXNext(!isXNext);
                setTurn(true);
            }
        })
        socket.on('reset', (userid) => {
            if (user !== userid) {
                setBoard(Array(9).fill(null))
            }
        })
        socket.on("recieve_message", (message, userid) => {
            if (user !== userid) {
                setTimeout(() => { setOppMessage(".") }, 1000)
                setTimeout(() => { setOppMessage("..") }, 2000)
                setTimeout(() => { setOppMessage(message) }, 3000)
            }
        })
        socket.on("connect_chat", (userid) => {
            if (user !== userid) {
                setOpponent(userid);
                console.log(userid, user)
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
                connectionRef.current = null
            }
            setCallEnded(true);
            setReceivingCall(false);
            setCallAccepted(false);
        })
        return (() => {
            socket.emit("leave", id)
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
                peer.signal(signal)
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
            peer.signal(callerSignal)
            connectionRef.current = peer
        } catch (error) {
            console.log(error)
        }

    }

    const leaveCall = () => {
        try {
            setCallEnded(true)
            socket.emit("callEnd", id)
            setReceivingCall(false)
        } catch (error) {
            console.log(error)
        }

    }

    const openVideoChat = () => {
        socket.emit('video_chat', user, id);
        setIsVideo(true);
        if (myVideo.current) {
            myVideo.current.srcObject = stream
        }
    }

    const buttonStyle = {
        backgroundColor: 'red',
        border: 'none',
        color: 'white',
        padding: '15px 32px',
        textAlign: 'center',
        textDecoration: 'none',
        display: 'inline-block',
        margin: '4px 2px',
        cursor: 'pointer',
        borderRadius: '8px',
        width: "8em",
        fontSize: '1.5em'
    };
    const handleClick = (index) => {
        if (!turn || board[index] || calculateWinner(board)) return;

        const newBoard = board.slice();
        newBoard[index] = isXNext ? 'X' : 'O';
        setBoard(newBoard);
        setIsXNext((prev) => !prev);
        setTurn(false)
        socket.emit('new_board', newBoard, id, user, isXNext);
    };

    const sendMessage = () => {
        if (message.length === 0) {
            return
        }
        setYourMessage(message);
        socket.emit('send_message', id, message, user);
        setMessage('')
    }

    const calculateWinner = (board) => {
        const lines = [
            [0, 1, 2],
            [3, 4, 5],
            [6, 7, 8],
            [0, 3, 6],
            [1, 4, 7],
            [2, 5, 8],
            [0, 4, 8],
            [2, 4, 6],
        ];
        for (let i = 0; i < lines.length; i++) {
            const [a, b, c] = lines[i];
            if (board[a] && board[a] === board[b] && board[a] === board[c]) {
                return board[a];
            }
        }
        return null;
    };
    const reset = () => {
        setBoard(Array(9).fill(null))
        socket.emit('reset', id, user)
    }
    const winner = calculateWinner(board);
    const status = winner
        ? `Winner: ${winner}`
        : `Next player: ${turn ? 'You' : 'Opponent'}`;

    const renderCell = (index) => (
        <div className="cell" onClick={() => handleClick(index)}>
            {board[index]}
        </div>
    );

    return (
        <div className="game">
            <div className="status">{status}</div>
            {id.length > 0 && <div><p style={{ color: "orange", fontSize: '1.2em' }}>Board Id : {id}</p></div>}
            <div className="board">
                {board.map((_, index) => renderCell(index))}
            </div>
            <br />
            <button style={buttonStyle} onClick={() => reset()}>Reset</button>
            {!isVideo && <button style={buttonStyle} onClick={() => openVideoChat()}>Video Chat</button>}
            <div className="container">
                <div className="video-call-container" style={{ position: "relative", height: "50vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#f0f2f5" }}>
                    <div className="video-container" style={{ position: "relative", borderRadius: "10px", overflow: "hidden", boxShadow: "0px 4px 15px rgba(0, 0, 0, 0.2)", backgroundColor: "#000" }}>
                        <div className="my-video-container" style={{ position: "absolute", bottom: "10px", right: "10px", width: "150px", height: "100px", borderRadius: "10px", overflow: "hidden", border: "2px solid #fff" }}>
                            {stream && <video playsInline muted ref={myVideo} autoPlay style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
                        </div>
                        <div className="user-video" style={{ width: "400px", height: "300px" }}>
                            {callAccepted && !callEnded ? (
                                <video playsInline ref={userVideo} autoPlay style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            ) : (
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%", height: "100%", color: "#fff" }}>
                                    Waiting for user to join...
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="call-button">
                    {callAccepted && !callEnded ? (
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
                            width: "6em",
                            fontSize: '1.5em'
                        }} variant="contained" color="secondary" onClick={leaveCall}>
                            Close Video Chat
                        </button>
                    ) : (
                        !receivingCall && <button style={{
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
                            fontSize: '1.5em'
                        }} onClick={() => callUser(opponent)}>
                            Connect
                        </button>
                    )}
                </div>
                <div>
                    {receivingCall && !callAccepted ? (
                        <div className="caller">
                            <p >Requesting video chat...</p>
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

            {(yourMessage.length > 0 || oppMessage.length > 0) && <div style={{
                width: "18em", backgroundColor: '#f0f0f0', borderRadius: '.5em', paddingLeft: '1em', paddingRight: '1em', marginTop: '.5em'
            }}>
                <div style={{ textAlign: 'left' }}><p style={{ color: "blue", fontSize: '1.2em' }}>Opponent : {oppMessage}</p></div>
                <div style={{ textAlign: 'right', marginBottom: '10px' }}><p style={{ color: "orange", fontSize: '1.2em' }}>You : {yourMessage}</p></div>
            </div>}
            <div style={{ display: 'flex', alignItems: 'center', paddingTop: ".5em", paddingBottom: "3em" }}>
                <input
                    type="text"
                    placeholder="Type your message here..."
                    style={{
                        padding: '10px',
                        fontSize: '16px',
                        border: '1px solid #ccc',
                        borderRadius: '4px 0 0 4px',
                        flex: 1
                    }}
                    onChange={(e) => {
                        setMessage(e.target.value);
                    }}
                    value={message}
                />
                <button
                    type="submit"
                    style={{
                        padding: '10px 20px',
                        fontSize: '16px',
                        border: '1px solid #ccc',
                        borderLeft: 'none',
                        backgroundColor: '#28a745',
                        color: 'white',
                        borderRadius: '0 4px 4px 0',
                        cursor: 'pointer'
                    }}
                    onClick={() => {
                        sendMessage()
                    }}
                >
                    Send
                </button>
            </div>
        </div>
    );
}

export default GameBoard;
