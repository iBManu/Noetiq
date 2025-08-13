import React from "react"
import MoreIcon from "../../public/more.svg?react"

interface Props {
    icon: string,
    title: string,
    isSelected: boolean;
    onClick?: () => void,
    handleOpenNoteOptionsDialog: () => void,
}

const Note: React.FC<Props> = ({ icon, title, isSelected, onClick, handleOpenNoteOptionsDialog }) => {
    return (
        <div className={`note ${isSelected ? "note-selected" : ""}`} onClick={onClick}>
            <p>
                <span>{icon}</span>{" "}
                {title.trim() === "" ? (
                    <span id="notetitle-placeholder"><i>Untitled</i></span>
                ) : (
                    title
                )}
            </p>
            <MoreIcon className="icon" onClick={handleOpenNoteOptionsDialog}/>
        </div>

    )
}

export default Note;