use crate::*;
use plotters::prelude::*;

#[derive(Default, Debug, Serialize, Deserialize, Clone)]
pub enum College {
    #[default]
    NA,
    HarveyMudd,
    ClaremontMcKenna,
    Scripps,
    Pitzer,
    Pomona,
    KeckGraduateInstitute,
    ClaremontGraduateUniversity,
}

pub struct ButtonRecordLog {
    pub log: Vec<ButtonRecord>,
    pub last_update: u64,
}

impl ButtonRecordLog {
    pub fn new() -> Self {
        ButtonRecordLog {
            log: Vec::new(),
            last_update: 0,
        }
    }

    pub fn add(&mut self, record: ButtonRecord) {
        self.last_update = record.timestamp;
        self.log.push(record);
    }

    pub fn get_last_update(&self) -> u64 {
        self.last_update
    }

    pub fn get_log(&self) -> &Vec<ButtonRecord> {
        &self.log
    }

    pub fn get_log_mut(&mut self) -> &mut Vec<ButtonRecord> {
        &mut self.log
    }

    pub fn get_log_by_timerange(&self, start: u64, end: u64) -> Vec<ButtonRecord> {
        self.log
            .iter()
            .filter(|r| r.timestamp >= start && r.timestamp <= end)
            .cloned()
            .collect()
    }

    pub fn make_histogram_png(
        &self,
        name: String,
        histogram_data: Vec<u32>,
    ) -> Result<(), Box<dyn std::error::Error>> {
        // Make graph based on start/end timing, and the interval, which is in seconds.
        let root = BitMapBackend::new(&name, (1600, 1200)).into_drawing_area();

        root.fill(&WHITE).unwrap();

        let mut chart = ChartBuilder::on(&root)
            .x_label_area_size(35)
            .y_label_area_size(40)
            .margin(5)
            .caption("Histogram Test", ("sans-serif", 50.0))
            .build_cartesian_2d((0u32..10u32).into_segmented(), 0u32..10u32)?;

        chart
            .configure_mesh()
            .disable_x_mesh()
            .bold_line_style(&WHITE.mix(0.3))
            .y_desc("Count")
            .x_desc("Bucket")
            .axis_desc_style(("sans-serif", 15))
            .draw()?;

        chart.draw_series(
            Histogram::vertical(&chart)
                .style(RED.mix(0.5).filled())
                .data(histogram_data.iter().map(|x| (*x, 1))),
        )?;

        root.present()?;

        Ok(())
    }

    pub fn make_csv(&self) -> Result<(), Box<dyn std::error::Error>> {
        let mut wtr = csv::Writer::from_path("button_log.csv")?;
        for record in &self.log {
            wtr.write_record(&[
                format!("{}", &record.timestamp),
                record.station_id.clone(),
                format!("{:?}", &record.college),
            ])?;
        }
        Ok(())
    }
}

#[derive(Default, Debug, Serialize, Deserialize, Clone)]
pub struct ButtonRecord {
    pub college: College,
    pub timestamp: u64,
    pub station_id: String,
}
