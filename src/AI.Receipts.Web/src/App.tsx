import './App.css';
import ReceiptScanner from './components/ReceiptScanner';

function App() {
    return (
        <div className="App">
            <header className="App-header">
                <h1>AI Receipts Scanner</h1>
                <p>Upload a receipt image to extract and manage receipt data</p>
            </header>
            <main className="App-main">
                <ReceiptScanner />
            </main>
        </div>
    );
}

export default App;
