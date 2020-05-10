import { LightningElement, track, api } from 'lwc';
import { subscribe } from 'lightning/empApi';
import { loadScript, loadStyle } from 'lightning/platformResourceLoader';
import CHARTJS from '@salesforce/resourceUrl/chartjsStream';




export default class streamingIoTChart extends LightningElement {

    // Set color of temperature text
    @track classNameTemp = 'temp-reading-green';

    //Chart public properties
    @api yLength;
    @api fakeMin;
    @api fakeMax;
    @api isFake;
    @api yellowStatus;
    @api redStatus;
    @api eventParameter;
    @api channelName;

    @api titleLabel;
    @api valueNameX;
    @api valueNameY;
    @api showCur;
    @api valSymb;
    @api redBar;
    @api greenBar;
    @api get chartHeight(){
        return `height:230px;`;
        // return `height:${this.chartHeight};`;
    }

    @track delayedEventValue;

    //The platform event value & empApi subscription object
    @track eventValue
    subscription = {};

    // Object for chart parameters
    chartConfig = {};

    // Track last event valuye
    @track lastEvtValue;

    // Boolean to track if renderedCallback() was executed
    chartInitialized = false;


    // Tracks changes to channelName text field
    handleChannelName(event) {
        this.channelName = event.target.value;
    }


    renderedCallback(){
        //console.log('value is: ', this.eventValue);
        if (this.chartInitialized) {
            return;
        }

        this.chartConfig.yLength = parseFloat(this.yLength);
        this.chartConfig.fakeMin = parseFloat(this.fakeMin);
        this.chartConfig.fakeMax = parseFloat(this.fakeMax);
        this.chartConfig.yellowStatus = parseFloat(this.yellowStatus);
        this.chartConfig.redStatus = parseFloat(this.redStatus);
        
        //this.isFake = this.isFake;
        this.chartInitialized = true;

        //Load scripts
        try{
            Promise.all([
                loadStyle(this, CHARTJS + '/Chart.css'),
                loadScript(this, CHARTJS + '/moment.js'),
                loadScript(this, CHARTJS + '/Chart.js')
                
            ])
                .then(() => {
                    this.initializeChart();
                })
                .catch(error => {
                    console.log('Error loading chart scripts: ' + error);
                });
        }catch(e){
            console.log('Error detected: ', e);
        }
       

          
        //Handle platform events 
        console.log('renderedCallback executed');
        const messageCallback = (response) => {
            console.log('Event received - ' + this.eventParameter + ' is : ', response.data.payload[this.eventParameter]);
            let value = parseFloat(response.data.payload[this.eventParameter]);
            this.eventValue =  value;
        };

        // Invoke subscribe method of empApi. Pass reference to messageCallback
        subscribe(this.channelName, -1, messageCallback).then(response => {
            // Response contains the subscription information on successful subscribe call
            console.log('Successfully subscribed to : ', JSON.stringify(response.channel));
            this.subscription = response;
        });
        

    }

    // When initial scripts are loaded, load the chartjstream.js library and render the chart
    initializeChart(){
        console.log('initializeChart executed');
        Promise.all([
            loadScript(this, CHARTJS + '/chartjstream.js')
        ])
            .then(() => {
                //thenThis = this;
                this.renderChart();
            })
            .catch(error => {
                console.log('Error loading chartjstream: ' + error);
            });
    }


    renderChart(){
        console.log('renderChart executed');

        //Variable to keep track when the first bar is loaded
        let firstNumber = true;

        // Color codes to use for chart bars
        // let chartColors = {
        //     green: 'rgb(149, 235, 91)',
        //     red: 'rgb(255, 84, 54)',
        //     darkGreen: 'rgb(69, 110, 42)',
        //     darkRed: 'rgb(133, 43, 28)'
        // };
        let chartColors = {
            green: this.greenBar,
            red: this.redBar
        };
        
        //Below function will be called to set the data for the y ass and dynamically set the barchart colors 
        let randomScalingFactor = () => {

            if(this.isFake === 'true'){
                this.isFake = true;
            }
            if(this.isFake === 'false'){
                this.isFake = false;
            }


            let setBarcolor = (length) =>{
                myChart.config.data.datasets[0].backgroundColor = [];
                myChart.config.data.datasets[0].borderColor = [];
                for(let i = 0; i < length; i++){
                    let valueArr = myChart.config.data.datasets[0].data;
                    for(let j = 0; j < length; j++){
                        if(valueArr[j].y > this.chartConfig.redStatus){
                            myChart.config.data.datasets[0].backgroundColor.push(chartColors.red);
                            // myChart.config.data.datasets[0].borderColor.push(chartColors.darkRed);
                            myChart.config.data.datasets[0].borderColor.push(chartColors.red);
                        }
                        if(valueArr[j].y < this.chartConfig.redStatus + 0.1){
                            myChart.config.data.datasets[0].backgroundColor.push(chartColors.green);
                            // myChart.config.data.datasets[0].borderColor.push(chartColors.darkGreen);
                            myChart.config.data.datasets[0].borderColor.push(chartColors.green);
                        }
                    }
                }
            }

            if(firstNumber){
                firstNumber = false;
                if(this.isFake){
                    this.eventValue = this.chartConfig.redStatus;
                }else{
                    this.eventValue = 0.0;
                }
            }
            if(!firstNumber){
                
                if(this.isFake){
                    this.eventValue  = Math.round( (Math.random() * (this.chartConfig.fakeMax - this.chartConfig.fakeMin) + this.chartConfig.fakeMin) * 10) / 10;
                }
                
                let length = myChart.config.data.datasets[0].data.length - 1;
                setBarcolor(length);
            }
                if(this.eventValue > this.chartConfig.redStatus){
                    this.classNameTemp = `color:${this.redBar};`;
                }
                if(this.eventValue < this.chartConfig.redStatus + 1){
                    this.classNameTemp = `color:${this.greenBar};`;

                }
                return this.eventValue;
            
        }



        let onRefresh = (chart) => {
            chart.config.data.datasets.forEach(function(dataset) {
                dataset.data.push({
                    x: Date.now(),
                    y: randomScalingFactor()
                });
            });
        }
        
        //let color = Chart.helpers.color;
        let config = {
            type: 'bar',
            data: {
                labels: [],
                datasets: [{
                    label: 'Device sensor',
                    //backgroundColor: color(chartColors.red).alpha(0.5).rgbString(),
                    backgroundColor: [],
                    borderColor: [],
                    borderWidth: 1,
                    data: []
                }]
            },
            options: {
                maintainAspectRatio: false,
                respnsive:true,
                legend: {
                    display: false
                },
                title: {
                    display: true,
                    text: this.valueNameX
                },
                scales: {
                    xAxes: [{
                        type: 'realtime',
                        barPercentage: 0.9,
                        realtime: {
                            duration: 20000,
                            refresh: 1300,
                            delay: 3500,
                            onRefresh: onRefresh
                        }
                    }],
                    yAxes: [{
                        display: true,
                        ticks: {
                            beginAtZero: true,
                            steps: 0.5,
                            stepValue: 0.5,
                            max: this.chartConfig.yLength
                        },
                        scaleLabel: {
                            display: true,
                            labelString: this.valueNameY
                        }
                    }]
                },
                tooltips: {
                    mode: 'nearest',
                    intersect: false
                },
                hover: {
                    mode: 'nearest',
                    intersect: false
                }
            }
        };
        
            let ctx = this.template.querySelector('.myChart').getContext('2d');
            let myChart = new Chart(ctx, config);
    
 
        
    }


}