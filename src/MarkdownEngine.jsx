import React from'react';import Markdown from'react-markdown';import remarkGfm from'remark-gfm';
export default function MarkdownEngine(props){return <Markdown {...props} remarkPlugins={[remarkGfm]}/>}
