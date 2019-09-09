import { LightningElement, track, api } from 'lwc';
import { subscribe, isEmpEnabled } from 'lightning/empApi';
import { loadScript, loadStyle } from 'lightning/platformResourceLoader';
import CHARTJS from '@salesforce/resourceUrl/chartjsStream';




export default class VehicleMeter extends LightningElement {

    //Set platform event
    @api channelName;
    @track classNameTemp = 'temp-reading-green';

    //Track last platform event send
    isLastSend = false;

    //Chart parameters
    @api yLength;
    @api yStep;
    @api fakeMin;
    @api fakeMax;
    @api isFake;
    @api yellowStatus;
    @api redStatus;
    @api eventParameter;
    
    //The platform event value
    @track eventValue;

    @track isSubscribeDisabled = false;
    @track isUnsubscribeDisabled = !this.isSubscribeDisabled;
    subscription = {};
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
        console.log('Can emppApi be used?');
        console.log(isEmpEnabled);
        window.yLength = parseFloat(this.yLength);
        window.yStep = parseFloat(this.yStep);
        window.fakeMin = parseFloat(this.fakeMin);
        window.fakeMax = parseFloat(this.fakeMax);
        window.yellowStatus = parseFloat(this.yellowStatus);
        window.redStatus = parseFloat(this.redStatus);
        
        //this.isFake = this.isFake;
        this.chartInitialized = true;

        //Load scripts
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

          
        //Handle platform events 
        console.log('renderedCallback executed');
        const messageCallback = (response) => {
            console.log(this.eventParameter + ' is : ', response.data.payload[this.eventParameter]);
            this.eventValue = parseFloat(response.data.payload[this.eventParameter]);
            //this.isLastSend = true;
            //window.myVar = this.eventValue;
            // Response contains the payload of the new message received
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

        let chartColors = {
            red: 'rgb(149, 235, 91)',
            yellow: 'rgb(255, 242, 102)',
            green: 'rgb(255, 84, 54)',
            darkRed: 'rgb(69, 110, 42)',
            darkYellow: 'rgb(150, 143, 59)',
            darkGreen: 'rgb(133, 43, 28)'
        };

        // let chartColors = {
        //     red: 'rgb(255, 84, 54)',
        //     yellow: 'rgb(255, 242, 102',
        //     green: 'rgb(149, 235, 91',
        //     darkRed: 'rgb(133, 43, 28)',
        //     darkYellow: 'rgb(150, 143, 59',
        //     darkGreen: 'rgb(69, 110, 42)'
        // };
   
        
        //Below function will be called to set the data for the y ass and dynamically set the barchart colors 
        let randomScalingFactor = () => {

            if(this.isFake === 'true'){
                this.isFake = true;
            }
            if(this.isFake === 'false'){
                this.isFake = false;
            }


            let setBarcolor = (length) =>{
                let lowRed = Math.round( (window.redStatus - 0.1) * 10) / 10;
                window.myChart.config.data.datasets[0].backgroundColor = [];
                window.myChart.config.data.datasets[0].borderColor = [];
                for(let i = 0; i < length; i++){
                    let valueArr = window.myChart.config.data.datasets[0].data;
                    for(let j = 0; j < length; j++){
                        if(valueArr[j].y < window.redStatus){
                            window.myChart.config.data.datasets[0].backgroundColor.push(chartColors.red);
                            window.myChart.config.data.datasets[0].borderColor.push(chartColors.darkRed);
                        }
                        if(valueArr[j].y > lowRed && valueArr[j].y < (window.yellowStatus + 0.1)){
                            window.myChart.config.data.datasets[0].backgroundColor.push(chartColors.yellow);
                            window.myChart.config.data.datasets[0].borderColor.push(chartColors.darkYellow);
                        }
                        if(valueArr[j].y > window.yellowStatus){
                            window.myChart.config.data.datasets[0].backgroundColor.push(chartColors.green);
                            window.myChart.config.data.datasets[0].borderColor.push(chartColors.darkGreen);
                        }
                    }
                }
            }

            if(firstNumber){
                firstNumber = false;
                if(this.isFake){
                    //window.myVar = 2.1;
                    this.eventValue = 2.1;
                }else{
                    //window.myVar = 0.0;
                    this.eventValue = 0.0;
                }
                //setBarcolor(window.myVar,1);
            }
            if(!firstNumber){
                
                if(this.isFake){
                   // window.myVar = Math.round( (Math.random() * (window.fakeMax - window.fakeMin) + window.fakeMin) * 10) / 10;
                    this.eventValue  = Math.round( (Math.random() * (window.fakeMax - window.fakeMin) + window.fakeMin) * 10) / 10;
                }
                
                let length = window.myChart.config.data.datasets[0].data.length - 1;
                //console.log('length is: ', length);
                setBarcolor(length);
            }
    
            
                if(this.eventValue > 7){
                    this.classNameTemp = 'temp-reading-red';
                }
                if(this.eventValue < 8){
                    this.classNameTemp = 'temp-reading-green';
                }
                return this.eventValue;
            
        }

        // Workaround to keep bars allignes as timedelay is inconsistent over time 
        /*
        let firsDate = false;
        let DateBefore;
        function handleDate(){
            if(!firsDate){
                firsDate = true;
                DateBefore = Date.now();
                return DateBefore;
            }
            DateBefore = DateBefore +1300;
            return DateBefore;
        }
        */

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
                    text: 'Temperature status'
                },
                scales: {
                    xAxes: [{
                        type: 'realtime',
                        barPercentage: 0.9,
                        realtime: {
                            duration: 20000,
                            refresh: 1300,
                            delay: 3000,
                            onRefresh: onRefresh
                        }
                    }],
                    yAxes: [{
                        display: true,
                        ticks: {
                            beginAtZero: true,
                            steps: window.yStep,
                            stepValue: window.yStep,
                            max: window.yLength
                        },
                        scaleLabel: {
                            display: true,
                            labelString: 'Temperature'
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
            window.myChart = new Chart(ctx, config);
    
 
        
    }


}