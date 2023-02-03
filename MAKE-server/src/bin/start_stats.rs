use std::collections::HashMap;

use chrono::{Timelike, Datelike};
use make::*;

fn main() {
    // Create stats folder if it doesn't exist
    if !std::path::Path::new("stats").exists() {
        std::fs::create_dir("stats").unwrap();
    }

    // Get the data from the database
    let data = load_database().unwrap();

    // Compute the stats
    compute_checkout_stats(data);
}

fn compute_checkout_stats(data: Data) {
    let checkouts = data.checkout_log;

    // Go through all checkouts, and see when they were checked out
    // to nearest 15 min
    let mut checkout_times = Vec::new();

    let days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    // Create a baseline of one for each time
    for day in 0..7 {
        for hour in 0..24 {
            checkout_times.push(format!("{}-{:02}:00", days[day], hour));
        }
    }

    // Most commonly checked out items
    let mut most_commonly_checked_out = HashMap::new();
    for checkout in checkouts.checkout_history.iter().chain(checkouts.currently_checked_out.iter()) {
        let time = checkout.timestamp_checked_out;

        // Timestamp is in seconds, convert to naivedatetime
        let time = chrono::NaiveDateTime::from_timestamp(time as i64, 0);

        // Offset time to utc-8
        let time = time - chrono::Duration::hours(8);

        // Get hour and minute
        let day = days[time.weekday().num_days_from_monday() as usize];
        let hour = time.hour();

        // Add to most commonly checked out
        for item in checkout.items.iter() {
            let count = most_commonly_checked_out.entry(item.clone()).or_insert(0);
            *count += 1;
        }

        // Add to checkout times
        checkout_times.push(format!("{}-{:02}:00", day, hour));
    }

    // Sort checkout times
    checkout_times.sort();

    // Compute the checkout times
    let mut checkout_times = checkout_times
        .iter()
        .fold(HashMap::new(), |mut map, time| {
            *map.entry(time).or_insert(0) += 1;
            map
        })
        .into_iter()
        .collect::<Vec<_>>();
    checkout_times.sort_by(|a, b| a.0.cmp(b.0));

    // Compute the most commonly checked out items
    let mut most_commonly_checked_out = most_commonly_checked_out
        .into_iter()
        .collect::<Vec<_>>();
    most_commonly_checked_out.sort_by(|a, b| b.1.cmp(&a.1));

    // Write the checkout times to a file
    let mut wtr = csv::Writer::from_path("stats/checkout_times.csv").unwrap();
    wtr.write_record(&["Time", "Monday", "Tuesday", "Wednesday", "Thursday", "Firday", "Saturday", "Sunday"]).unwrap();
    for i in 0..24 {
        let mut row = Vec::new();
        row.push(format!("{:02}:00", i));
        for day in 0..7 {
            let time = format!("{}-{:02}:00", days[day], i);
            let count = checkout_times.iter().find(|(t, _)| *t == &time).map(|(_, c)| *c).unwrap_or(0);
            row.push(format!("{}", count));
        }
        wtr.write_record(&row).unwrap();
    }

    // Write the most commonly checked out items to a file
    let mut wtr = csv::Writer::from_path("stats/most_commonly_checked_out.csv").unwrap();
    for (item_id, count) in most_commonly_checked_out {
        wtr.write_record(&[item_id, format!("{}", count)]).unwrap();
    }
}