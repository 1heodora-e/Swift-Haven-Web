"use strict";

/**
 * add event on element
 */

const addEventOnElem = function (elem, type, callback) {
  if (elem.length > 1) {
    for (let i = 0; i < elem.length; i++) {
      elem[i].addEventListener(type, callback);
    }
  } else {
    elem.addEventListener(type, callback);
  }
};

/**
 * navbar toggle
 */

const navbar = document.querySelector("[data-navbar]");
const navToggler = document.querySelectorAll("[data-nav-toggler]");
const overlay = document.querySelector("[data-overlay]");

const toggleNavbar = function () {
  navbar.classList.toggle("active");
  overlay.classList.toggle("active");
};

addEventOnElem(navToggler, "click", toggleNavbar);

/**
 * close navbar when click on any navbar links
 */

const navLinks = document.querySelectorAll("[data-nav-link]");

const closeNavbar = function () {
  navbar.classList.remove("active");
  overlay.classList.remove("active");
};

addEventOnElem(navLinks, "click", closeNavbar);

/**
 * header active when scroll down
 */

const header = document.querySelector("[data-header]");

const headerActive = function () {
  window.scrollY > 100
    ? header.classList.add("active")
    : header.classList.remove("active");
};

addEventOnElem(window, "scroll", headerActive);

/**
 * accordion toggle
 */

const accordionAction = document.querySelectorAll("[data-accordion-action]");

const toggleAccordion = function () {
  this.classList.toggle("active");
};

addEventOnElem(accordionAction, "click", toggleAccordion);

const sections = document.querySelectorAll("section");

window.addEventListener("scroll", () => {
  const scrollY = window.scrollY;

  sections.forEach((section) => {
    const sectionTop = section.offsetTop;
    const sectionHeight = section.clientHeight;

    if (scrollY >= sectionTop - sectionHeight / 2) {
      section.classList.add("active");
    } else {
      section.classList.remove("active");
    }
  });
});

// CycleWise functionality
class CycleWise {
    constructor() {
        this.initializeData();
        this.setupEventListeners();
        this.setupCalendar();
        this.loadData();
        this.updateUI();
    }

    initializeData() {
        this.cycles = [];
        this.selectedSymptoms = new Set();
        this.currentDate = new Date();
        this.displayDate = new Date();
    }

    setupEventListeners() {
        // Period logging
        document.getElementById('add-entry')?.addEventListener('click', () => this.addPeriodEntry());
        
        // Symptom chips
        document.querySelectorAll('.chip')?.forEach(chip => {
            chip.addEventListener('click', () => this.toggleSymptom(chip));
        });

        // Calendar navigation
        document.getElementById('prev-month')?.addEventListener('click', () => this.changeMonth(-1));
        document.getElementById('next-month')?.addEventListener('click', () => this.changeMonth(1));

        // Phase cards
        document.querySelectorAll('.phase-card')?.forEach(card => {
            card.addEventListener('click', () => this.showPhaseDetails(card.dataset.phase));
        });
    }

    toggleSymptom(chip) {
        chip.classList.toggle('active');
        const symptom = chip.dataset.symptom;
        if (this.selectedSymptoms.has(symptom)) {
            this.selectedSymptoms.delete(symptom);
        } else {
            this.selectedSymptoms.add(symptom);
        }
    }

    addPeriodEntry() {
        const startDate = document.getElementById('start-date')?.value;
        const endDate = document.getElementById('end-date')?.value;
        const customSymptoms = document.getElementById('symptoms')?.value;

        if (!startDate) {
            this.showNotification('Please enter a start date', 'error');
            return;
        }

        const entry = {
            startDate: new Date(startDate),
            endDate: endDate ? new Date(endDate) : null,
            symptoms: [...this.selectedSymptoms],
            customSymptoms: customSymptoms?.split(',').map(s => s.trim()).filter(s => s) || []
        };

        this.cycles.push(entry);
        this.saveCycles();
        this.updatePredictions();
        this.updateCalendar();
        this.updateHistory();
        this.showNotification('Period entry added successfully', 'success');

        // Reset form
        if (document.getElementById('start-date')) document.getElementById('start-date').value = '';
        if (document.getElementById('end-date')) document.getElementById('end-date').value = '';
        if (document.getElementById('symptoms')) document.getElementById('symptoms').value = '';
        this.selectedSymptoms.clear();
        document.querySelectorAll('.chip').forEach(chip => chip.classList.remove('active'));
    }

    updatePredictions() {
        if (this.cycles.length < 2) {
            this.updatePredictionText('next-period', 'Need more data');
            this.updatePredictionText('cycle-length', 'Need more data');
            this.updatePredictionText('ovulation-date', 'Need more data');
            return;
        }

        // Calculate average cycle length
        const cycleLengths = [];
        for (let i = 1; i < this.cycles.length; i++) {
            const days = Math.round((this.cycles[i].startDate - this.cycles[i-1].startDate) / (1000 * 60 * 60 * 24));
            cycleLengths.push(days);
        }
        const avgCycleLength = Math.round(cycleLengths.reduce((a, b) => a + b) / cycleLengths.length);

        // Predict next period
        const lastPeriod = this.cycles[this.cycles.length - 1].startDate;
        const nextPeriod = new Date(lastPeriod);
        nextPeriod.setDate(nextPeriod.getDate() + avgCycleLength);

        // Predict ovulation
        const ovulationDate = new Date(lastPeriod);
        ovulationDate.setDate(ovulationDate.getDate() + Math.round(avgCycleLength / 2) - 14);

        this.updatePredictionText('next-period', this.formatDate(nextPeriod));
        this.updatePredictionText('cycle-length', `${avgCycleLength} days`);
        this.updatePredictionText('ovulation-date', this.formatDate(ovulationDate));
    }

    updatePredictionText(elementId, text) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = text;
            element.classList.add('fade-in');
            setTimeout(() => element.classList.remove('fade-in'), 300);
        }
    }

    setupCalendar() {
        this.updateCalendarHeader();
        this.updateCalendar();
    }

    updateCalendarHeader() {
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'];
        document.getElementById('current-month')?.textContent = 
            `${monthNames[this.displayDate.getMonth()]} ${this.displayDate.getFullYear()}`;
    }

    updateCalendar() {
        const calendar = document.getElementById('calendar');
        if (calendar) {
            calendar.innerHTML = '';

            const firstDay = new Date(this.displayDate.getFullYear(), this.displayDate.getMonth(), 1);
            const lastDay = new Date(this.displayDate.getFullYear(), this.displayDate.getMonth() + 1, 0);
            
            // Add empty cells for days before the first of the month
            for (let i = 0; i < firstDay.getDay(); i++) {
                calendar.appendChild(this.createCalendarDay(''));
            }

            // Add days of the month
            for (let date = 1; date <= lastDay.getDate(); date++) {
                const dayElement = this.createCalendarDay(date);
                const currentDate = new Date(this.displayDate.getFullYear(), this.displayDate.getMonth(), date);
                
                // Mark period days
                if (this.isDateInPeriod(currentDate)) {
                    dayElement.classList.add('period');
                }
                
                // Mark ovulation days
                if (this.isOvulationDay(currentDate)) {
                    dayElement.classList.add('ovulation');
                }

                calendar.appendChild(dayElement);
            }
        }
    }

    createCalendarDay(content) {
        const day = document.createElement('div');
        day.className = 'calendar-day';
        day.textContent = content;
        return day;
    }

    isDateInPeriod(date) {
        return this.cycles.some(cycle => {
            const start = cycle.startDate;
            const end = cycle.endDate || new Date(start.getTime() + (5 * 24 * 60 * 60 * 1000)); // Default 5 days if no end date
            return date >= start && date <= end;
        });
    }

    isOvulationDay(date) {
        if (this.cycles.length < 2) return false;
        
        const lastPeriod = this.cycles[this.cycles.length - 1].startDate;
        const ovulationDate = new Date(lastPeriod);
        ovulationDate.setDate(ovulationDate.getDate() + 14); // Approximate ovulation day
        
        return date.getTime() === ovulationDate.getTime();
    }

    changeMonth(delta) {
        this.displayDate.setMonth(this.displayDate.getMonth() + delta);
        this.updateCalendarHeader();
        this.updateCalendar();
    }

    updateHistory() {
        const historyList = document.getElementById('history-list');
        if (historyList) {
            historyList.innerHTML = '';

            this.cycles.slice().reverse().forEach(cycle => {
                const entry = document.createElement('div');
                entry.className = 'history-item fade-in';
                
                const dateRange = cycle.endDate ? 
                    `${this.formatDate(cycle.startDate)} - ${this.formatDate(cycle.endDate)}` :
                    this.formatDate(cycle.startDate);

                const symptoms = [...cycle.symptoms, ...cycle.customSymptoms].join(', ');
                
                entry.innerHTML = `
                    <strong>${dateRange}</strong>
                    ${symptoms ? `<br>Symptoms: ${symptoms}` : ''}
                `;
                
                historyList.appendChild(entry);
            });
        }
    }

    showPhaseDetails(phase) {
        const phaseInfo = {
            menstrual: {
                title: 'Menstrual Phase',
                description: 'This is when your period occurs. The uterine lining is shed, and hormone levels are at their lowest.',
                tips: 'Focus on rest and self-care. Light exercise like yoga can help with cramps.'
            },
            follicular: {
                title: 'Follicular Phase',
                description: 'Your body prepares for ovulation. Estrogen levels begin to rise, boosting energy and mood.',
                tips: 'Great time for starting new projects and high-intensity workouts.'
            },
            ovulation: {
                title: 'Ovulation Phase',
                description: 'An egg is released from the ovary. You might feel more energetic and social.',
                tips: 'Your energy levels are at their peak. Perfect for challenging workouts and social activities.'
            },
            luteal: {
                title: 'Luteal Phase',
                description: 'Post-ovulation phase until your next period. Hormone levels begin to drop.',
                tips: 'Practice self-care and stress management. Gentle exercise can help with PMS symptoms.'
            }
        };

        const info = phaseInfo[phase];
        document.getElementById('current-phase')?.textContent = info.title;
        document.getElementById('phase-description')?.innerHTML = `
            ${info.description}<br><br>
            <strong>Tips:</strong> ${info.tips}
        `;
    }

    formatDate(date) {
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    showNotification(message, type) {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type} fade-in`;
        notification.textContent = message;

        // Add to document
        document.body.appendChild(notification);

        // Remove after 3 seconds
        setTimeout(() => {
            notification.classList.add('fade-out');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    saveCycles() {
        localStorage.setItem('cycleWiseData', JSON.stringify(this.cycles));
    }

    loadData() {
        const savedData = localStorage.getItem('cycleWiseData');
        if (savedData) {
            this.cycles = JSON.parse(savedData).map(cycle => ({
                ...cycle,
                startDate: new Date(cycle.startDate),
                endDate: cycle.endDate ? new Date(cycle.endDate) : null
            }));
        }
    }

    updateUI() {
        this.updatePredictions();
        this.updateCalendar();
        this.updateHistory();
        this.showPhaseDetails('menstrual'); // Show initial phase info
    }
}

// Initialize CycleWise when DOM is loaded and on tracker page
document.addEventListener('DOMContentLoaded', () => {
    if (document.querySelector('.calendar')) {
        new CycleWise();
    }
});
