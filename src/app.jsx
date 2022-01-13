import React from 'react';
import ReactDOM from 'react-dom';
import CodeMirror from 'react-codemirror';

const ScratchPad = () => {
    const options = {
        theme: "material"
    }
    const updateScratchpad = newValue => {
        console.log(newValue)
    }

    return <CodeMirror 
        value="Hello from codemirror in react in Electron"
        onChange={updateScratchpad}
        options={options}
    />
}

ReactDOM.render(<ScratchPad />, document.body);