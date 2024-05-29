
import { Chess, Color, PieceSymbol, Square } from "chess.js";
import { useState } from "react";
import { MOVE } from "../screens/Game";

export const ChessBoard = ({ chess, board, socket, setBoard, playerColor, currentTurn, setCurrentTurn }: {
    chess: Chess;
    setBoard: React.Dispatch<React.SetStateAction<({
        square: Square;
        type: PieceSymbol;
        color: Color;
    } | null)[][]>>;
    board: ({
        square: Square;
        type: PieceSymbol;
        color: Color;
    } | null)[][];
    socket: WebSocket;
    playerColor: Color;
    currentTurn: Color;
    setCurrentTurn: React.Dispatch<React.SetStateAction<Color>>;
}) => {
    const [from, setFrom] = useState<null | Square>(null);
    const [promotionSquare, setPromotionSquare] = useState<null | Square>(null);
    const [showPromotionModal, setShowPromotionModal] = useState(false);

    const isPromotion = (from: Square, to: Square) => {
        const piece = chess.get(from);
        return piece?.type === 'p' && (to[1] === '8' || to[1] === '1');
    };

    const onDragStart = (event: DragEvent | TouchEvent, square: Square) => {
        const piece = chess.get(square);
        console.log(`Drag start: piece: ${piece}, playerColor: ${playerColor}, currentTurn: ${currentTurn}`);
        if (!piece || piece.color !== playerColor || playerColor !== currentTurn) {
            if (event instanceof DragEvent) event.preventDefault(); // Prevent dragging if the piece does not belong to the player or it's not their turn
            return;
        }
        if (event instanceof DragEvent && event.dataTransfer) {
            event.dataTransfer.setData('from', square);
        } else {
            setFrom(square);
        }
    };

    const onDrop = (event: DragEvent | TouchEvent, to: Square) => {
        event.preventDefault();
        const fromSquare = event instanceof DragEvent ? event.dataTransfer?.getData('from') as Square : from;
        console.log(`Drop: from: ${fromSquare}, to: ${to}, playerColor: ${playerColor}, currentTurn: ${currentTurn}`);

        if (!fromSquare || chess.get(fromSquare)?.color !== playerColor || playerColor !== currentTurn) {
            return; // Prevent move if the piece does not belong to the player or it's not their turn
        }

        if (isPromotion(fromSquare, to)) {
            setFrom(fromSquare);
            setPromotionSquare(to);
            setShowPromotionModal(true);
            return;
        }

        makeMove(fromSquare, to, undefined);
    };

    const onDragOver = (event: DragEvent | TouchEvent) => {
        event.preventDefault();
    };

    const makeMove = (from: Square, to: Square, promotion?: PieceSymbol) => {
        const move = { from, to, promotion: promotion || undefined };
        console.log(`Make move: from: ${from}, to: ${to}, promotion: ${promotion}`);

        try {
            chess.move(move);
            setBoard(chess.board());

            socket.send(JSON.stringify({
                type: MOVE,
                payload: {
                    move
                }
            }));
            
            // Update current turn
            const newTurn = chess.turn();
            console.log(`New turn: ${newTurn}`);
            setCurrentTurn(newTurn); // Update the current turn state
        } catch (e) {
            console.log(e);
        }

        setFrom(null);
        setPromotionSquare(null);
        setShowPromotionModal(false);
    };

    const handlePromotion = (promotion: PieceSymbol) => {
        if (from && promotionSquare) {
            makeMove(from, promotionSquare, promotion);
        }
    };
    
    const onTouchStart = (event: React.TouchEvent, square: Square) => {
        console.log("Touch start", square);
        onDragStart(event.nativeEvent, square);
    };

    const onTouchEnd = (event: React.TouchEvent, to: Square) => {
        console.log("Touch end", to);
        onDrop(event.nativeEvent, to);
    };

    return (
        <div className={`text-white ${playerColor === 'b' ? 'transform rotate-180' : ''}`}>
            {board.map((row, i) => (
                <div key={i} className={`flex ${playerColor === 'b' ? 'flex-row-reverse' : ''}`}>
                    {row.map((square, j) => {
                        const squareRepresentation = String.fromCharCode(97 + (j % 8)) + "" + (8 - i) as Square;
                        const isEvenSquare = (i + j) % 2 === 0;

                        return (
                            <div
                                key={j}
                                className={`w-10 h-10 md:w-16 md:h-16 ${isEvenSquare ? 'bg-green-500' : 'bg-slate-500'}`}
                                onDrop={(event) => onDrop(event.nativeEvent as DragEvent, squareRepresentation)}
                                onDragOver={(event) => onDragOver(event.nativeEvent as DragEvent)}
                                onTouchStart={(event) => onTouchStart(event, squareRepresentation)}
                                onTouchEnd={(event) => onTouchEnd(event, squareRepresentation)}
                            >
                                <div className={`w-full flex justify-center items-center h-full ${playerColor === 'b' ? 'transform rotate-180' : ''}`}>
                                    {square && (
                                        <img
                                            className="w-8 h-8 md:w-12 md:h-12 cursor-pointer"
                                            draggable
                                            onDragStart={(event) => onDragStart(event.nativeEvent as DragEvent, squareRepresentation)}
                                            src={`/${square.color === "b" ? square.type : `${square.type.toUpperCase()} copy`}.png`}
                                            alt={`${square.type}`}
                                        />
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            ))}

            {showPromotionModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
                    <div className="bg-slate-300 p-4 rounded-lg">
                        <h2 className="text-black mb-4">Choose Promotion</h2>
                        <div className="flex justify-around">
                            {['q', 'r', 'b', 'n'].map((piece) => (
                                <button
                                    key={piece}
                                    className="text-black p-2"
                                    onClick={() => handlePromotion(piece as PieceSymbol)}
                                >
                                    <img
                                        className="w-8 h-8"
                                        src={`/${chess.turn() === "b" ? piece : `${piece.toUpperCase()} copy`}.png`}
                                        alt={piece}
                                    />
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
