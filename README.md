# Fantasy Football Draft - Best Players
<img width="2527" height="1258" alt="image" src="https://github.com/user-attachments/assets/2864280e-c25e-4463-84f5-90d742aa50f2" />

## Overview

This is a simple web app to help fantasy football players track average draft positions (ADP) across multiple sources and mark players as drafted in real-time. It highlights the best available player dynamically as you mark players as drafted.

## Features

* Displays player rankings from multiple sources: Underdog, CBS, ESPN, FFPC, BB10s, and Yahoo (Y!)
* Calculates and displays an average ADP based on available rankings, precise to two decimals
* Filter players by position (WR, RB, QB, TE, DEF, K)
* Click rows to toggle drafted status — drafted players are grayed out
* Highlights the best available (lowest average ADP) player in glowing green
* Responsive and clean UI using Google Fonts and custom CSS

## Files

* `index.html`: Main HTML page, includes the table and filter UI
* `styles.css`: Styling for the page, table, and row highlights
* `script.js`: JavaScript handling CSV loading, filtering, drafted toggling, and dynamic highlights
* `data/adp.csv`: CSV file with player data and rankings from multiple sources

## Data Source

The CSV data was sourced from [4for4 ADP Rankings](https://www.4for4.com/adp?paging=0).

## How to Use

1. Place all files in the same project folder, keeping the `adp.csv` inside a `data` folder.
2. Open `index.html` in a modern web browser.
3. Use the dropdown filter to select player positions.
4. Click on any player row to mark/unmark them as drafted.
5. The best available player based on average ADP will be highlighted in green.

## CSV Format

The app expects the CSV with the following columns (in order):

```
"ADP","Position","Player","Team","Underdog","CBS","ESPN","FFPC","BB10s","NFL","Y!","10-Team","12-Team"
```

* The app uses the rankings from Underdog, CBS, ESPN, FFPC, BB10s, and Y! to compute the average ADP.
* Missing or dash `-` entries are ignored when calculating averages.

## Notes

* This app runs entirely client-side; no backend is required.
* Ensure the browser allows fetching local files or host the files on a local server for full functionality.
* The drafted player state resets on page reload.
