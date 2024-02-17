"use strict";

// Function to fetch partners data
async function fetchPartnersData() {
    const response = await fetch(
        "https://candidate.hubteam.com/candidateTest/v3/problem/dataset?userKey=125e2ebea13364258e1a2e8e2173"
    );
    const data = await response.json();
    return data;
}

// Function to process partners data and find best dates
function processPartnersData(data) {
    const partners = data.partners;
    const countryEvents = {};

    // Process each partner's available dates
    partners.forEach((partner) => {
        const country = partner.country;
        if (!countryEvents[country]) {
            countryEvents[country] = [];
        }

        // Convert dates to Date objects for easier comparison
        const availableDates = partner.availableDates.map(
            (date) => new Date(date)
        );

        // Find all consecutive dates
        let consecutiveDates = [];
        for (let i = 0; i < availableDates.length - 1; i++) {
            if (availableDates[i + 1] - availableDates[i] === 86400000) {
                //  86400000 milliseconds in a day
                consecutiveDates.push([
                    availableDates[i],
                    availableDates[i + 1],
                ]);
            }
        }

        // Sort by date and count of partners
        consecutiveDates.sort((a, b) => {
            if (a[0] - b[0] !== 0) {
                return a[0] - b[0];
            } else {
                return a.length - b.length;
            }
        });

        // Add the best date range to the country's events
        if (consecutiveDates.length > 0) {
            countryEvents[country].push({
                attendeeCount: consecutiveDates[0].length,
                attendees: [partner.email], // Assuming only one partner per date range
                startDate: consecutiveDates[0][0].toISOString().split("T")[0], // Get only the date part
            });
        }
    });

    // Sort by attendee count and start date
    for (const country in countryEvents) {
        countryEvents[country].sort((a, b) => {
            if (a.attendeeCount !== b.attendeeCount) {
                return b.attendeeCount - a.attendeeCount;
            } else {
                return new Date(a.startDate) - new Date(b.startDate);
            }
        });
    }

    // Convert the data to the required format
    const result = {
        countries: Object.keys(countryEvents).map((country) => ({
            attendeeCount: countryEvents[country][0]
                ? countryEvents[country][0].attendeeCount
                : 0,
            attendees: countryEvents[country][0]
                ? countryEvents[country][0].attendees
                : [],
            name: country,
            startDate: countryEvents[country][0]
                ? countryEvents[country][0].startDate
                : null,
        })),
    };

    return result;
}

// Function to send the processed data back to the API
async function sendProcessedData(data) {
    const response = await fetch(
        "https://candidate.hubteam.com/candidateTest/v3/problem/result?userKey=125e2ebea13364258e1a2e8e2173",
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
        }
    );
    const result = await response.json();
    return result;
}

// Main function to execute the process
async function main() {
    try {
        const partnersData = await fetchPartnersData();
        const processedData = processPartnersData(partnersData);
        const result = await sendProcessedData(processedData);
        console.log(result);
    } catch (error) {
        console.error("Error:", error);
    }
}

// Run the main function
main();
