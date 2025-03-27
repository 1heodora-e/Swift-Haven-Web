import { getFirestore, doc, collection, addDoc, query, where, orderBy, onSnapshot } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-auth.js";

class HistoryTracker {
    constructor() {
        this.db = getFirestore();
        this.auth = getAuth();
        this.historyList = document.getElementById('history-list');
        this.setupAuthListener();
    }

    setupAuthListener() {
        onAuthStateChanged(this.auth, (user) => {
            if (user) {
                // Start listening to user's history when they log in
                this.listenToUserHistory(user.uid);
            }
        });
    }

    listenToUserHistory(userId) {
        // Create a query for user's entries, ordered by timestamp
        const entriesRef = collection(this.db, 'users', userId, 'entries');
        const q = query(entriesRef, orderBy('timestamp', 'desc'));

        // Real-time listener for history updates
        onSnapshot(q, (snapshot) => {
            this.historyList.innerHTML = ''; // Clear existing entries
            
            snapshot.forEach((doc) => {
                const data = doc.data();
                this.addHistoryEntry(data);
            });
        });
    }

    async addEntry(entryData) {
        try {
            const user = this.auth.currentUser;
            if (!user) throw new Error('No user logged in');

            // Add timestamp to entry data
            const entry = {
                ...entryData,
                timestamp: new Date().toISOString()
            };

            // Add entry to user's subcollection
            await addDoc(collection(this.db, 'users', user.uid, 'entries'), entry);
            
            console.log('Entry added successfully');
        } catch (error) {
            console.error('Error adding entry:', error);
            throw error;
        }
    }

    addHistoryEntry(data) {
        const entryElement = document.createElement('div');
        entryElement.className = 'history-item';
        
        const startDate = new Date(data.startDate).toLocaleDateString();
        const endDate = data.endDate ? new Date(data.endDate).toLocaleDateString() : 'Ongoing';
        
        entryElement.innerHTML = `
            <div class="history-date-range">
                ${startDate} - ${endDate}
            </div>
            <div class="history-symptoms">
                Symptoms: ${data.symptoms || 'None recorded'}
            </div>
            <div class="history-timestamp">
                Recorded on: ${new Date(data.timestamp).toLocaleString()}
            </div>
        `;
        
        this.historyList.appendChild(entryElement);
    }
}

// Initialize the history tracker
const historyTracker = new HistoryTracker();

// Export for use in other files
export { historyTracker }; 