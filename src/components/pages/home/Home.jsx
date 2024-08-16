import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import "./Home.css"
import axios from 'axios';
import useAuth from '../../../hooks/useAuth';

export default function Home() {
    // const baseURL = "http://localhost:3001"
    const baseURL = "https://xox-backend.onrender.com"

    const [join, setJoin] = useState(false);
    const [boardId, setBoardId] = useState('')
    const navigate = useNavigate();
    const { setId, setUser } = useAuth();
    useEffect(() => {
        const generateId = () => {
            const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
            let result = '';
            const charactersLength = characters.length;

            for (let i = 0; i < 7; i++) {
                result += characters.charAt(Math.floor(Math.random() * charactersLength));
            }
            setUser(result)
        }
        generateId()
    }, [])

    const buttonStyle = {
        backgroundColor: '#4CAF50',
        border: 'none',
        color: 'white',
        padding: '15px 32px',
        textAlign: 'center',
        textDecoration: 'none',
        display: 'inline-block',
        margin: '4px 2px',
        cursor: 'pointer',
        borderRadius: '8px',
        width: "15em",
        fontSize: '1.5em'
    };
    const inputStyle = {
        padding: '10px',
        margin: '10px 0',
        boxSizing: 'border-box',
        borderRadius: '4px',
        border: '2px solid green',
        fontSize: '16px',
        width: '22.5em',
    };
    const createBroad = () => {
        axios.post(`${baseURL}/create_game`).then((res) => {
            console.log(res)
            setId(res.data.board_id);
            navigate('/board');
        })
    }

    const joinGame = () => {
        if (boardId.length > 0) {
            setId(boardId);
            navigate('/board')
        }
    }

    return (
        <div className='home'>
            <h1 style={{ color: 'grey', fontSize: '4em' }}>Tic Tac Toe</h1>
            <button style={buttonStyle} onClick={() => {
                createBroad()
            }}>Create Game</button>
            <button style={buttonStyle} onClick={() => {
                setJoin((prev) => !prev)
            }}>Join Game</button>
            {join &&
                <>
                    <input style={inputStyle} type="text" onChange={(e) => {
                        setBoardId(e.target.value)
                    }} />
                    <button style={{
                        color: "white", backgroundColor: 'blue', textAlign: 'center',
                        textDecoration: 'none', display: 'inline-block',
                        margin: '4px 2px',
                        cursor: 'pointer',
                        borderRadius: '8px',
                        width: '10em',
                        padding: '10px 25px',
                        fontSize: '1.2em'

                    }} onClick={() => joinGame()}>Submit</button>
                </>
            }
        </div>
    )
}
