import React from 'react';
import ReactDOM from 'react-dom';
import CodeMirror from 'react-codemirror';

const ScratchPad = ({text}) => {
    const options = {
        theme: "material"
    }
    const updateScratchpad = newValue => {
        window.scratchpad.saveContent(newValue);
    }

    return <CodeMirror 
        value={text}
        onChange={updateScratchpad}
        options={options}
    />
}

const updateScratchpad = newValue => {
    window.scratchpad.saveContent(newValue);
};

(async () => {
    const content = await window.scratchpad.content;
    ReactDOM.render(<ScratchPad text={content} />, document.body);
})();