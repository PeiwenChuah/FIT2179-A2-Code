// Function to load and parse CSV
async function renderTreemap() {
    const response = await fetch('data/hospital_beds_treemap.csv');
    const csvText = await response.text();
    
    // Parse CSV rows
    const rows = csvText.split('\n').slice(1); // skip header
    const rawData = rows.map(row => {
        const cols = row.split(',');
        return {
            date: cols[0],
            state: cols[1],
            district: cols[2],
            type: cols[3],
            beds: parseInt(cols[4])
        };
    }).filter(d => 
        d.date === "2022-01-01" && 
        d.state !== "Malaysia" && 
        d.district !== "All Districts" && 
        d.type !== "all" &&
        !isNaN(d.beds)
    );

    // State Logo Mapping
    const stateLogos = {
        "Johor": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/Coat_of_arms_of_Johor.svg/100px-Coat_of_arms_of_Johor.svg.png",
        "Kedah": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/93/Coat_of_arms_of_Kedah.svg/100px-Coat_of_arms_of_Kedah.svg.png",
        "Kelantan": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a3/Coat_of_arms_of_Kelantan.svg/100px-Coat_of_arms_of_Kelantan.svg.png",
        "Melaka": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/30/Coat_of_arms_of_Malacca.svg/100px-Coat_of_arms_of_Malacca.svg.png",
        "Negeri Sembilan": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0a/Coat_of_arms_of_Negeri_Sembilan.svg/100px-Coat_of_arms_of_Negeri_Sembilan.svg.png",
        "Pahang": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/22/Coat_of_arms_of_Pahang.svg/100px-Coat_of_arms_of_Pahang.svg.png",
        "Perak": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/Coat_of_arms_of_Perak.svg/100px-Coat_of_arms_of_Perak.svg.png",
        "Perlis": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b3/Coat_of_arms_of_Perlis.svg/100px-Coat_of_arms_of_Perlis.svg.png",
        "Pulau Pinang": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d5/Coat_of_arms_of_Penang.svg/100px-Coat_of_arms_of_Penang.svg.png",
        "Sabah": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/bf/Coat_of_arms_of_Sabah.svg/100px-Coat_of_arms_of_Sabah.svg.png",
        "Sarawak": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/01/Coat_of_arms_of_Sarawak.svg/100px-Coat_of_arms_of_Sarawak.svg.png",
        "Selangor": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/03/Coat_of_arms_of_Selangor.svg/100px-Coat_of_arms_of_Selangor.svg.png",
        "Terengganu": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e5/Coat_of_arms_of_Terengganu.svg/100px-Coat_of_arms_of_Terengganu.svg.png",
        "W.P. Kuala Lumpur": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b3/Coat_of_arms_of_Kuala_Lumpur.svg/100px-Coat_of_arms_of_Kuala_Lumpur.svg.png",
        "W.P. Labuan": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/03/Coat_of_arms_of_Labuan.svg/100px-Coat_of_arms_of_Labuan.svg.png",
        "W.P. Putrajaya": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/30/Coat_of_arms_of_Putrajaya.svg/100px-Coat_of_arms_of_Putrajaya.svg.png"
    };

    // Prepare data structure for Highcharts
    let chartData = [];
    let states = [...new Set(rawData.map(d => d.state))];

    // Add State parents
    states.forEach(state => {
        chartData.push({
            id: state,
            name: state,
            color: Highcharts.getOptions().colors[states.indexOf(state) % 10]
        });
    });

    // Add District & Type children
    rawData.forEach(d => {
        chartData.push({
            name: `${d.district} - ${d.type.replace(/_/g, ' ').toUpperCase()}`,
            parent: d.state,
            value: d.beds
        });
    });

    Highcharts.chart('chart03', {
        series: [{
            type: 'treemap',
            layoutAlgorithm: 'squarified',
            allowDrillToNode: true,
            dataLabels: {
                enabled: true,
                useHTML: true,
                formatter: function() {
                    // If it's a top-level state node
                    if (stateLogos[this.point.name]) {
                        return `
                            <div style="text-align:center;">
                                <img src="${stateLogos[this.point.name]}" style="width:25px; height:auto;"><br/>
                                <span style="font-size:11px;">${this.point.name}</span>
                            </div>`;
                    }
                    // For smaller district boxes, only show if they are big enough
                    return this.point.value > 100 ? `<span style="font-size:9px;">${this.point.name}: ${this.point.value}</span>` : '';
                }
            },
            levels: [{
                level: 1,
                dataLabels: {
                    enabled: true,
                    align: 'center',
                    verticalAlign: 'middle',
                    style: { fontSize: '12px', color: 'white', fontWeight: 'bold' }
                },
                borderWidth: 2
            }],
            data: chartData
        }],
        title: {
            text: 'Hospital Bed Capacity by State, District, and Type (2022)',
            align: 'left',
            style: { fontFamily: 'Georgia', fontSize: '1.2rem' }
        },
        subtitle: {
            text: 'Click on a state to drill down into districts',
            align: 'left'
        },
        tooltip: {
            pointFormat: "<b>{point.name}</b>: {point.value} Beds"
        }
    });
}

// Initial call
renderTreemap();