import React,{Suspense}from'react';import recoverableLazy,{resetFailedTools}from'./recoverableLazy.jsx';
const Engine=recoverableLazy(()=>import('./MarkdownEngine.jsx'));
const Plain=({children})=><div className="markdown-source">{children}</div>;
class FormattingBoundary extends React.Component{constructor(props){super(props);this.state={failed:false,attempt:0}}static getDerivedStateFromError(){return{failed:true}}render(){return this.state.failed?<><Plain>{this.props.source}</Plain><p className="markdown-fallback" role="status">Formatting unavailable. Original text is shown. <button type="button" onClick={()=>{resetFailedTools();this.setState(s=>({failed:false,attempt:s.attempt+1}))}}>Retry formatting</button></p></>:<React.Fragment key={this.state.attempt}>{this.props.children}</React.Fragment>}}
function MarkdownText(props){return <FormattingBoundary source={props.children}><Suspense fallback={<Plain>{props.children}</Plain>}><Engine {...props}/></Suspense></FormattingBoundary>}

// Unchanged message text must not rerun the parser for each composer keystroke.
export default React.memo(MarkdownText);
