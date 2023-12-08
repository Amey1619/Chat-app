import './App.css';
import { Route } from "react-router-dom";
import Homepage from './Pages/Homepage';
import ChatPages from './Pages/ChatPage';
function App() {
  return (
    <div className="App">
      <Route path="/" component={Homepage} exact/>
      <Route path="/chats" component={ChatPages} />
    </div>
  );
}

export default App;
