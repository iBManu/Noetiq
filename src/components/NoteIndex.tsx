import React from "react"
import { Header } from "./types"

interface Props {
    indexList: Header[]
}

const NoteIndex: React.FC<Props> = ({ indexList }) => {
    return (
        <div id="indexBar">
            <h3>Content</h3>

            {indexList.map((header, idx) => (
                <div className="index-header">
                    <p key={idx} className={`index-header-${header.level}`}>{header.text}</p>
                </div>
            ))}

        </div>
    )
}

export default NoteIndex;