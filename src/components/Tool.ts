import Header from "@editorjs/header";
import ToggleBlock from "editorjs-toggle-block"
import List from "@editorjs/list"
import Table from "@editorjs/table"
import Code from "@editorjs/code"
import InlineCode from "@editorjs/inline-code";
import Underline from "@editorjs/underline"
import Hotkey from "editorjs-inline-hotkey"
import Striketrough from "@sotaproject/strikethrough"
import Delimiter from "@editorjs/delimiter"

export const EDITOR_JS_TOOLS = {

    // Block types
    header: Header,
    delimiter: Delimiter,
    table: Table,
    list: List,
    toggleBlock: ToggleBlock,

    // Inline tools
    underline: Underline,
    striketrough: Striketrough,
    code: Code,
    inlineCode: InlineCode,
    hotkey: Hotkey,
}