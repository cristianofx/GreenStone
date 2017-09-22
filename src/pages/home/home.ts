import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';
import { AlertController } from 'ionic-angular';
import { Storage } from '@ionic/storage';
import * as moment from 'moment';

import { LocalNotifications } from '@ionic-native/local-notifications';
import { Vibration } from '@ionic-native/vibration';

import { ViewChild } from '@angular/core';
import { TimerComponent } from '../timer/timer';

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {

  @ViewChild(TimerComponent) timer: TimerComponent;

  isDisabled = true;
  timeToWork: string;
  tolerance: string;
  hourIn: string;
  hourOut1: string = '';
  hourOut2: string = '';
  timeRemaining: number;
  timerStarted: boolean = false;

  constructor(public navCtrl: NavController, public alertCtrl: AlertController, public storage: Storage
              , private localNotifications: LocalNotifications, private vibration: Vibration) {

    this.setTriggerEvent();

    storage.get('timeToWork').then((val) => {
      this.timeToWork = val || '';
      storage.get('tolerance').then((val) => {
        this.tolerance = val || '';
        storage.get('hourIn').then((val) => {
          this.hourIn = val || '';
          this.calculate();
        });
      });
    });
  }

  calculate(){
    console.log('The time is', this.hourIn);
    this.storage.set('hourIn', this.hourIn);

    let momentDate = moment();
    let out1 = momentDate.second(0).minute(parseInt(this.hourIn.split(':')[1])).hour(parseInt(this.hourIn.split(':')[0]));
    let timeSpan = (60 * (parseInt(this.timeToWork.split(':')[0]))) + (parseInt(this.timeToWork.split(':')[1]));
    let hourOut1local = out1.add(timeSpan, 'minutes').subtract(parseInt(this.tolerance.split(':')[1]), 'minutes');
    this.hourOut1 = hourOut1local.format('HH:mm');

    let now = moment();
    this.resetTimer(hourOut1local.diff(now, 'seconds'));

    let hourOutDateObject = hourOut1local.toDate();
    let out2 = momentDate.second(0).minute(parseInt(this.hourIn.split(':')[1])).hour(parseInt(this.hourIn.split(':')[0]));
    timeSpan = (60 * (parseInt(this.timeToWork.split(':')[0]))) + (parseInt(this.timeToWork.split(':')[1]));
    let hourOut2local = out2.add(timeSpan, 'minutes').add(parseInt(this.tolerance.split(':')[1]), 'minutes');
    this.hourOut2 = hourOut2local.format('HH:mm');
    this.localNotifications.clearAll();

    if(hourOutDateObject > new Date()){
      this.startTimer();

      // Schedule delayed notification
      this.localNotifications.schedule({
        id: 1,
        text: 'Fim do turno',
        at: hourOutDateObject,
        led: 'FF0000',
        sound: null,
        icon: "file://assets/icon/favicon.ico"
      });
    }
  }

  startTimer(){
    if(this.timerStarted != true){
      this.timer.startTimer();
      this.timerStarted = true;
    }
  }

  resetTimer(diffSeconds: number){
    this.timeRemaining = diffSeconds;
    this.timer.timer.secondsRemaining = diffSeconds;
  }

  setTriggerEvent(){
    let vib = this.vibration;
    let alert = this.alertCtrl;

    this.localNotifications.on('trigger', function(notification){ 
      setTimeout(() => vib.vibrate([2000,1000,2000,1000,2000]), 2000);
      let alertMessage = alert.create({
        title: 'Fim de Turno',
        subTitle: 'Hora de ir para casa.',
        buttons: ['OK']
      });
      alertMessage.present();
      this.localNotifications.clearAll();
    });

    this.localNotifications.on('click', function(){
      vib.vibrate(0);
    });
  }

  clockIn(){
    let alert = this.alertCtrl.create({
      title: 'Confirmar entrada',
      message: 'Confirmar início da contagem?',
      buttons: [
        {
          text: 'Não',
          role: 'cancel',
          handler: () => {
            //console.log('Cancel clicked');
          }
        },
        {
          text: 'Sim',
          handler: () => {
            alert.present();
            let momentDate = moment();
            this.hourIn = momentDate.format('HH:mm');
            this.calculate();
          }
        }
      ]
    });
    alert.present();
  }

}
