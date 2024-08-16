import React, { useEffect, useState } from 'react';
import './Xox.css';
import useAuth from '../../../hooks/useAuth';
import io from "socket.io-client";

let socket;
const EndPoint = "http://localhost:3001"

function GameBoard() {

    const { id, user } = useAuth();
    const [board, setBoard] = useState(Array(9).fill(null));
    const [isXNext, setIsXNext] = useState(true);
    const [turn, setTurn] = useState(true);

    useEffect(() => {
        socket = io(EndPoint);

        id.length > 0 && socket.emit("set up", id);
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
    }, [])

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
        </div>
    );
}

export default GameBoard;
