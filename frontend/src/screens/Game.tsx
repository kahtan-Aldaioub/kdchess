import { useEffect, useState, useRef } from "react";
import { Button } from "../components/Button";
import { ChessBoard } from "../components/ChessBoard";
import { useSocket } from "../hooks/useSocket";
import { Chess } from 'chess.js';

export const INIT_GAME = "init_game";
export const MOVE = "move";
export const GAME_OVER = "game_over";
export const UPDATE_TIME = "update_time";

const TIMER_OPTIONS = {
    "3min": 180, // 3 minutes in seconds
    "10min": 600 // 10 minutes in seconds
} as const;

export const Game = () => {
    const socket = useSocket();
    const [chess, setChess] = useState(new Chess());
    const [board, setBoard] = useState(chess.board());
    const [started, setStarted] = useState(false);
    const [gameOver, setGameOver] = useState(false);
    const [winner, setWinner] = useState<string | null>(null);
    const [playerColor, setPlayerColor] = useState<'w' | 'b'>('w');
    const [timeControl, setTimeControl] = useState<number>(TIMER_OPTIONS["3min"]);
    const [whiteTime, setWhiteTime] = useState<number>(TIMER_OPTIONS["3min"]);
    const [blackTime, setBlackTime] = useState<number>(TIMER_OPTIONS["3min"]);
    const [currentTurn, setCurrentTurn] = useState<'w' | 'b'>('w');
    const [isConnecting, setIsConnecting] = useState(false);
    const [moveHistory, setMoveHistory] = useState<string[]>([]);

    const whiteTimerRef = useRef<number | null>(null);
    const blackTimerRef = useRef<number | null>(null);

    useEffect(() => {
        if (!socket) {
            return;
        }

        socket.onmessage = (event) => {
            const message = JSON.parse(event.data);

            switch (message.type) {
                case INIT_GAME:
                    setBoard(chess.board());
                    setStarted(true);
                    setIsConnecting(false);
                    setGameOver(false);
                    setWinner(null);
                    setPlayerColor(message.payload.color);
                    setWhiteTime(message.payload.timeControl);
                    setBlackTime(message.payload.timeControl);
                    setCurrentTurn('w'); // Start with white's turn
                    break;
                case MOVE:
                    const move = message.payload;
                    chess.move(move);
                    setBoard(chess.board());
                    handleMove(); // Pass the color of the player who made the move
                    break;
                case GAME_OVER:
                    setGameOver(true);
                    setWinner(message.payload.winner);
                    clearTimers();
                    break;
                case UPDATE_TIME:
                    setWhiteTime(message.payload.w);
                    setBlackTime(message.payload.b);
                    break;
            }
        };
    }, [socket]);

    useEffect(() => {
        if (started) {
            startTimer('w'); // Start the timer for white initially
        }
        return () => clearTimers();
    }, [started]);

    const startTimer = (color: 'w' | 'b') => {
        clearTimers();
        if (color === 'w') {
            whiteTimerRef.current = window.setInterval(() => {
                setWhiteTime(prev => {
                    if (prev <= 0) {
                        clearTimers();
                        socket?.send(JSON.stringify({ type: GAME_OVER, payload: { winner: 'b' } }));
                        return prev;
                    }
                    return prev - 1;
                });
            }, 1000);
        } else {
            blackTimerRef.current = window.setInterval(() => {
                setBlackTime(prev => {
                    if (prev <= 0) {
                        clearTimers();
                        socket?.send(JSON.stringify({ type: GAME_OVER, payload: { winner: 'w' } }));
                        return prev;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
    };

    const clearTimers = () => {
        if (whiteTimerRef.current) {
            clearInterval(whiteTimerRef.current);
            whiteTimerRef.current = null;
        }
        if (blackTimerRef.current) {
            clearInterval(blackTimerRef.current);
            blackTimerRef.current = null;
        }
    };

    const handleMove = () => {
        const newTurn = chess.turn();
        console.log(`handleMove: nextTurn: ${newTurn}`);
        setCurrentTurn(newTurn);
        startTimer(newTurn); // Start the timer for the next player
    
        // Update move history
        const history = chess.history();

        
        setMoveHistory(history);
    };
    

    const handlePlayAgain = () => {
        window.location.reload();
    };

    const handleTimeControlChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedTime = TIMER_OPTIONS[e.target.value as keyof typeof TIMER_OPTIONS];
        setTimeControl(selectedTime);
        setWhiteTime(selectedTime);
        setBlackTime(selectedTime);
    };

    const handlePlayButtonClick = () => {
        setIsConnecting(true);
        socket?.send(JSON.stringify({ type: INIT_GAME, payload: { timeControl } }));
    };

    return (
        <div className="justify-center flex">
            <div className="pt-12 pb-16 max-w-screen-lg w-full">
                <div className="grid grid-cols-1 md:grid-cols-6 gap-4 w-full">
                    <div className="md:col-span-4 w-full flex justify-center">
                        {playerColor && socket && (
                            <ChessBoard
                                chess={chess}
                                setBoard={setBoard}
                                socket={socket}
                                board={board}
                                playerColor={playerColor}
                                currentTurn={currentTurn}
                                setCurrentTurn={setCurrentTurn}
                            />
                        )}
                    </div>
                    <div className="md:col-span-2 bg-slate-900 w-full flex justify-center flex-col items-center">
    {!started && (
        <div>
            <label className="text-white">Select Time Control:</label>
            <select onChange={handleTimeControlChange} className="text-black ml-2">
                <option value="3min">3 Minutes</option>
                <option value="10min">10 Minutes</option>
            </select>
            {!isConnecting ? (
                <Button onClick={handlePlayButtonClick}>
                    Play
                </Button>
            ) : (
                <div className="text-white">Connecting with opponent...</div>
            )}
        </div>
    )}
    {started && (
        <div className="text-white">
            <div>White Time: {Math.floor(whiteTime / 60)}:{whiteTime % 60 < 10 ? `0${whiteTime % 60}` : whiteTime % 60}</div>
            <div>Black Time: {Math.floor(blackTime / 60)}:{blackTime % 60 < 10 ? `0${blackTime % 60}` : blackTime % 60}</div>
        </div>
    )}
 
</div>

                    </div>
                    {started && (
    <div className=" mt-4">
        <h2 className="text-lg font-bold text-white">Move History</h2>
        <ul className="custom-ul">
    {moveHistory.map((move, index) => (
        <li key={index} className="custom-li">{move}</li>
    ))}
</ul>
    </div>
)}
                </div>
                {gameOver && (
                    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center">
                        <div className="bg-white p-8 rounded-lg shadow-lg">
                            <h2 className="text-2xl font-bold">
                            {winner !== "Draw" ? `${winner} wins!` : "It's a draw!"}
                            </h2>
                            <Button onClick={handlePlayAgain}>
                                Play Again
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        
    );
};
