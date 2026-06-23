// Initialize Supabase client
const supabaseUrl = "https://paahfqlktdevkapmlpih.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBhYWhmcWxrdGRldmthcG1scGloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIyMjc3NjcsImV4cCI6MjA5NzgwMzc2N30.LUp-rAa6-qj2yQanFGaXsLc7cBq3NbJQVfTtuqRqD10";
const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);

const MIN = 1;
const MAX = 100;
let Ans = Math.floor(Math.random() * (MAX - MIN + 1)) + MIN;

// Get DOM elements
const nameInput = document.getElementById("UserName");
const guessInput = document.getElementById("UserInput");
const submitBtn = document.getElementById("btn");
const route = document.getElementById("My-route");
const attempts = document.getElementById("attempts");
let counter = 0;

console.log("Secret Answer:", Ans); 

// Load global board instantly when page loads
fetchLeaderboard();

// Click listener logic
submitBtn.addEventListener("click", async function() {
    let currentName = nameInput.value.trim();
    let userGuess = Number(guessInput.value);

    // 1. Name Check Validation
    if (currentName === "") {
        route.textContent = "⚠️ Please enter your name before guessing!";
        route.style.color = "orange";
        return;
    }

    // 2. Input Number Validation
    if (!guessInput.value || isNaN(userGuess)) {
        route.textContent = "Please enter a valid number!";
        route.style.color = "red";
        return;
    }

    // 3. Game logic comparisons
    if (userGuess < MIN || userGuess > MAX) {
        route.textContent = `Hey! Pick a number between ${MIN} and ${MAX}.`;
        route.style.color = "orange";
    } else if (userGuess > Ans) {
        counter++;
        route.textContent = "Too high! Try a lower number.";
        route.style.color = "rgb(119, 0, 255)";
        attempts.textContent = counter;
    } else if (userGuess < Ans) {
        counter++;
        route.textContent = "Too low! Try a higher number.";
        route.style.color = "rgb(119, 0, 255)";
        attempts.textContent = counter;
    } else {
        counter++;
        route.textContent = `🎉 Correct! The answer was ${Ans}! Checking score...`;
        route.style.color = "green";
        attempts.textContent = counter;

        // --- NEW UPDATE LOGIC START ---
        
        // 1. Check if user already exists in the table
        const { data: existingPlayer, error: fetchError } = await supabaseClient
            .from('scores')
            .select('userName, attempts')
            .eq('userName', currentName)
            .maybeSingle(); // Safely returns 1 object or null if not found

        if (fetchError) {
            console.error("Error checking existing player:", fetchError.message);
        }

        if (!existingPlayer) {
            // Player doesn't exist yet, insert a fresh row
            const { error: insertError } = await supabaseClient
                .from('scores')
                .insert([{ userName: currentName, attempts: counter }]);
            
            if (insertError) console.error("Error saving new score:", insertError.message);
            else console.log("New player registered successfully!");
            
        } else if (counter < existingPlayer.attempts) {
            // Player exists AND beat their old score (fewer attempts)
            route.textContent = `🎉 New Personal Best! Updating leaderboard...`;
            
            const { error: updateError } = await supabaseClient
                .from('scores')
                .update({ attempts: counter })
                .eq('userName', currentName);
                
            if (updateError) console.error("Error updating score:", updateError.message);
            else console.log("High score updated successfully!");
        } else {
            // Player exists but didn't beat their previous record
            route.textContent = `🎉 Correct! But your record is ${existingPlayer.attempts} attempts.`;
            console.log("Score was not updated because it wasn't a personal best.");
        }

        // --- NEW UPDATE LOGIC END ---

        fetchLeaderboard(); // Refresh the scoreboard layout

        // Setup next game cycle
        Ans = Math.floor(Math.random() * (MAX - MIN + 1)) + MIN;
        console.log("Secret Answer:", Ans);

        setTimeout(function() {
            counter = 0;
            attempts.textContent = counter;
            route.textContent = "Waiting for input...";
            route.style.color = "rgb(119, 0, 255)"; 
        }, 4000);
    }
    guessInput.value = "";
});

// Enter key shortcut
guessInput.addEventListener("keydown", function(event) {
    if (event.key === "Enter") {
        submitBtn.click(); 
    }
});

// Fetch Top 10 from Cloud
async function fetchLeaderboard() {
    const { data: topScores, error } = await supabaseClient
        .from('scores')
        .select('userName, attempts')
        .order('attempts', { ascending: true }) 
        .limit(10);

    if (error) {
        console.error("Error fetching leaderboard:", error.message);
        return;
    }
    updateLeaderboardUI(topScores);
}

// Render dynamic rows to HTML Table
function updateLeaderboardUI(scores) {
    const tableBody = document.getElementById("leaderboard-body");
    tableBody.innerHTML = "";

    if (!scores || scores.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="3">No high scores yet. Be the first!</td></tr>`;
        return;
    }

    scores.forEach(function(row, index) {
        tableBody.innerHTML += `
            <tr>
                <td>${index + 1}</td>
                <td>${row.userName}</td>
                <td>${row.attempts}</td>
            </tr>
        `;
    });
}