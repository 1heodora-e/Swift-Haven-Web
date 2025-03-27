import { getFirestore, doc, setDoc, getDoc, collection, query, orderBy, getDocs } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-auth.js";

class HistoryTracker {
    constructor() {
        this.db = getFirestore();
        this.auth = getAuth();
        this.setupHistoryTracking();
        this.initializeHistoryDisplay();
    }

    async setupHistoryTracking() {
        // Listen for form submission
        const addEntryButton = document.getElementById('add-entry');
        if (addEntryButton) {
            addEntryButton.addEventListener('click', async () => {
                await this.saveEntry();
            });
        }
    }

    async saveEntry() {
        const user = this.auth.currentUser;
        if (!user) return;

        try {
            // Get form values
            const startDate = document.getElementById('start-date').value;
            const endDate = document.getElementById('end-date').value;
            
            // Get selected symptoms
            const selectedSymptoms = Array.from(document.querySelectorAll('.chip.active'))
                .map(chip => chip.dataset.symptom);
            
            // Get custom symptoms
            const customSymptoms = document.getElementById('symptoms').value
                .split(',')
                .map(s => s.trim())
                .filter(s => s);

            // Combine all symptoms
            const allSymptoms = [...selectedSymptoms, ...customSymptoms];

            // Create entry object
            const entry = {
                startDate,
                endDate,
                symptoms: allSymptoms,
                createdAt: new Date().toISOString(),
                userId: user.uid
            };

            // Save to Firestore
            const entryRef = doc(collection(this.db, 'users', user.uid, 'entries'));
            await setDoc(entryRef, entry);

            // Update history display
            await this.displayHistory();

            // Clear form
            this.clearForm();

        } catch (error) {
            console.error('Error saving entry:', error);
        }
    }

    clearForm() {
        document.getElementById('start-date').value = '';
        document.getElementById('end-date').value = '';
        document.getElementById('symptoms').value = '';
        document.querySelectorAll('.chip.active').forEach(chip => {
            chip.classList.remove('active');
        });
    }

    async displayHistory() {
        const user = this.auth.currentUser;
        if (!user) return;

        try {
            const historyList = document.getElementById('history-list');
            if (!historyList) return;

            // Clear existing history
            historyList.innerHTML = '';

            // Get user's entries
            const entriesRef = collection(this.db, 'users', user.uid, 'entries');
            const q = query(entriesRef, orderBy('createdAt', 'desc'));
            const querySnapshot = await getDocs(q);

            querySnapshot.forEach(doc => {
                const entry = doc.data();
                const historyItem = this.createHistoryItem(entry);
                historyList.appendChild(historyItem);
            });

        } catch (error) {
            console.error('Error displaying history:', error);
        }
    }

    createHistoryItem(entry) {
        const item = document.createElement('div');
        item.className = 'history-item';

        const dateRange = document.createElement('div');
        dateRange.className = 'history-date-range';
        dateRange.innerHTML = `
            <strong>Period:</strong> ${new Date(entry.startDate).toLocaleDateString()} 
            ${entry.endDate ? `- ${new Date(entry.endDate).toLocaleDateString()}` : '(ongoing)'}
        `;

        const symptoms = document.createElement('div');
        symptoms.className = 'history-symptoms';
        symptoms.innerHTML = entry.symptoms.length > 0 
            ? `<strong>Symptoms:</strong> ${entry.symptoms.join(', ')}`
            : '<strong>No symptoms recorded</strong>';

        const timestamp = document.createElement('div');
        timestamp.className = 'history-timestamp';
        timestamp.textContent = `Recorded on: ${new Date(entry.createdAt).toLocaleString()}`;

        item.appendChild(dateRange);
        item.appendChild(symptoms);
        item.appendChild(timestamp);

        return item;
    }

    initializeHistoryDisplay() {
        // Listen for auth state changes
        onAuthStateChanged(this.auth, (user) => {
            if (user) {
                this.displayHistory();
            }
        });
    }
}

// Initialize history tracker
const historyTracker = new HistoryTracker();

// Export for potential use in other files
export default HistoryTracker; 