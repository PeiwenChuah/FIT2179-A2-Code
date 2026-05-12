async function renderChart03() {
    try {
        const response = await fetch('data/hospital_beds_treemap.csv');
        if (!response.ok) throw new Error('CSV not found');
        const csvText = await response.text();
        
        const rows = csvText.split(/\r?\n/).filter(row => row.trim().length > 0);
        const dataRows = rows.slice(1); 

        const filteredData = dataRows.map(row => {
            const cols = row.split(',');
            if (cols.length < 5) return null;
            return {
                date: cols[0].trim(),
                state: cols[1].trim(),
                district: cols[2].trim(),
                type: cols[3].trim(),
                beds: parseInt(cols[4])
            };
        }).filter(d => 
            d !== null && d.date === "2022-01-01" && 
            d.state !== "Malaysia" && d.district !== "All Districts" && 
            d.type !== "all" && !isNaN(d.beds) && d.beds > 0
        );

        // State Logo Mapping (Ensuring direct HTTPS links)
        const stateLogos = {
            "Johor": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/Coat_of_arms_of_Johor.svg/100px-Coat_of_arms_of_Johor.svg.png",
            "Selangor": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/03/Coat_of_arms_of_Selangor.svg/100px-Coat_of_arms_of_Selangor.svg.png",
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
            "Terengganu": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e5/Coat_of_arms_of_Terengganu.svg/100px-Coat_of_arms_of_Terengganu.svg.png",
            "W.P. Kuala Lumpur": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b3/Coat_of_arms_of_Kuala_Lumpur.svg/100px-Coat_of_arms_of_Kuala_Lumpur.svg.png",
            "W.P. Labuan": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/03/Coat_of_arms_of_Labuan.svg/100px-Coat_of_arms_of_Labuan.svg.png",
            "W.P. Putrajaya": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/30/Coat_of_arms_of_Putrajaya.svg/100px-Coat_of_arms_of_Putrajaya.svg.png"
        };

        let chartData = [];
        let states = [...new Set(filteredData.map(d => d.state))];

        // Level 1: States
        states.forEach(state => {
            chartData.push({ id: state, name: state, color: '#222' });
        });

        // Level 2: Districts
        let districtKeys = [...new Set(filteredData.map(d => `${d.state}|${d.district}`))];
        districtKeys.forEach(key => {
            const [state, district] = key.split('|');
            chartData.push({ id: key, name: district, parent: state });
        });

        // Level 3: Bed types
        filteredData.forEach(d => {
            chartData.push({
                name: d.type.replace(/_/g, ' ').toUpperCase(),
                parent: `${d.state}|${d.district}`,
                value: d.beds,
                color: Highcharts.getOptions().colors[states.indexOf(d.state) % 10]
            });
        });

        Highcharts.chart('chart03', {
            chart: { 
                height: 800, 
                backgroundColor: '#111', // Dark background like image_e2ca07.jpg
                style: { fontFamily: 'Arial' }
            },
            title: { 
                text: 'MALAYSIA HOSPITAL BEDS BY STATE & DISTRICT', 
                style: { color: '#EEE', fontWeight: 'bold' } 
            },
            series: [{
                type: 'treemap',
                layoutAlgorithm: 'squarified',
                allowDrillToNode: true,
                // These settings are critical for the "Finviz" look
                levels: [{
                    level: 1,
                    layoutAlgorithm: 'squarified',
                    dataLabels: {
                        enabled: true,
                        useHTML: true,
                        align: 'left',
                        verticalAlign: 'top',
                        style: { zIndex: 100, pointerEvents: 'none' },
                        formatter: function() {
                            const logo = stateLogos[this.point.name];
                            if (logo) {
                                return `
                                <div style="display: flex; align-items: center; background: rgba(0,0,0,0.8); padding: 2px 8px; border-radius: 2px; border: 1px solid #444; width: max-content;">
                                    <img src="${logo}" style="width:16px; height:16px; margin-right:6px;" onerror="this.style.display='none'">
                                    <span style="color:white; font-size:12px; font-weight:bold; text-transform: uppercase;">${this.point.name}</span>
                                </div>`;
                            }
                        }
                    },
                    borderWidth: 4,
                    borderColor: '#000'
                }, {
                    level: 2,
                    dataLabels: {
                        enabled: true,
                        style: { fontSize: '9px', color: '#ddd', textOutline: 'none' },
                        formatter: function() {
                            // Only show district name if it has enough space
                            return this.point.value > 100 ? this.point.name : null;
                        }
                    },
                    borderWidth: 1,
                    borderColor: 'rgba(255,255,255,0.1)'
                }],
                data: chartData
            }],
            tooltip: {
                backgroundColor: '#222',
                style: { color: '#FFF' },
                pointFormat: "<b>{point.name}</b>: {point.value} Beds"
            },
            credits: { enabled: false }
        });
    } catch (e) { 
        console.error(e);
        document.getElementById('chart03').innerHTML = "Error loading CSV or Rendering Chart";
    }
}
renderChart03();