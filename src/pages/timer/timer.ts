import {Component, Input} from '@angular/core';
 
@Component({
    selector: 'timer',
    templateUrl: 'timer.html'
})
export class TimerComponent {
 
    @Input() timeInSeconds: number;
    public timer: ITimer;
 
    constructor() {
    }
 
    ngOnInit() {
        this.initTimer();
    }
 
    hasFinished() {
        return this.timer.hasFinished;
    }
 
    initTimer() {
        if(!this.timeInSeconds) { this.timeInSeconds = 0; }
 
        this.timer = <ITimer>{
            seconds: this.timeInSeconds,
            runTimer: false,
            hasStarted: false,
            hasFinished: false,
            secondsRemaining: this.timeInSeconds
        };
 
        this.timer.displayTime = this.getSecondsAsDigitalClock(this.timer.secondsRemaining);
    }

    resetTimer() {
        if(!this.timeInSeconds) { this.timeInSeconds = 0; }
 
        this.timer = <ITimer>{
            seconds: this.timeInSeconds,
            runTimer: this.timer.runTimer,
            hasStarted: this.timer.hasStarted,
            hasFinished: false,
            secondsRemaining: this.timer.secondsRemaining
        };
 
        this.timer.displayTime = this.getSecondsAsDigitalClock(this.timer.secondsRemaining);
        this.startTimer();
    }
 
    startTimer() {
        if(this.timer.runTimer == false && this.timer.hasStarted == false){
            this.timer.hasStarted = true;
            this.timer.runTimer = true;
            this.timerTick();
        }
    }
 
    pauseTimer() {
        this.timer.runTimer = false;
    }
 
    resumeTimer() {
        this.startTimer();
    }
 
    timerTick() {
        setTimeout(() => {
            if (!this.timer.runTimer) { return; }
            if (this.timer.secondsRemaining > 0) {
                this.timer.secondsRemaining--;
                this.timer.displayTime = this.getSecondsAsDigitalClock(this.timer.secondsRemaining);
                this.timerTick();
            }
            else {
                this.timer.hasFinished = true;
                this.timer.runTimer = false;
                this.timer.hasStarted = false;
            }
        }, 1000);
    }
 
    getSecondsAsDigitalClock(inputSeconds: number) {
        var sec_num = parseInt(inputSeconds.toString(), 10); // don't forget the second param
        var hours   = Math.floor(sec_num / 3600);
        var minutes = Math.floor((sec_num - (hours * 3600)) / 60);
        var seconds = sec_num - (hours * 3600) - (minutes * 60);
        var hoursString = '';
        var minutesString = '';
        var secondsString = '';
        hoursString = (hours < 10) ? "0" + hours : hours.toString();
        minutesString = (minutes < 10) ? "0" + minutes : minutes.toString();
        secondsString = (seconds < 10) ? "0" + seconds : seconds.toString();
        return hoursString + ':' + minutesString + ':' + secondsString;
    }
}


export interface ITimer {
    seconds: number;
    secondsRemaining: number;
    runTimer: boolean;
    hasStarted: boolean;
    hasFinished: boolean;
    displayTime: string;
}
