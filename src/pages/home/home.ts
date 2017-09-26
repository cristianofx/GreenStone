import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';
import { AlertController } from 'ionic-angular';
import { Storage } from '@ionic/storage';
import { ConfigPage } from "../config/config";
import * as moment from 'moment';

import { LocalNotifications } from '@ionic-native/local-notifications';
import { DatePicker } from '@ionic-native/date-picker';
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
  lunchTime: string;
  timeRemaining: number;
  timerStarted: boolean = false;
  started: boolean = false;
  totalTime:string = '';
  lastCallBackReceived: boolean = false;

  constructor(public navCtrl: NavController, public alertCtrl: AlertController, public storage: Storage
              , private localNotifications: LocalNotifications, private vibration: Vibration, private datePicker: DatePicker) {

    
    storage.get('timeToWork').then((val) => {
      this.timeToWork = val || '';
      storage.get('lunchTime').then((val) => {
        this.lunchTime = val ||'';
        this.setTotalTime();
        storage.get('tolerance').then((val) => {
          this.tolerance = val || '';
          storage.get('hourIn').then((val) => {
            this.hourIn = val || '';
            this.setTriggerEvent();
            storage.get('started').then((val) => {
              this.started = val || false;
              this.lastCallBackReceived = true;
              this.calculate();
            });
          });
        });
      });
    });
  }

  goToConfig(){
    this.navCtrl.setRoot(ConfigPage);
  }

  setTotalTime(){
    let lunchMinutes = (60 * (parseInt(this.lunchTime.split(':')[0]))) + (parseInt(this.lunchTime.split(':')[1]));
    let momentDate = moment();
    let total = momentDate.second(0).minute(parseInt(this.timeToWork.split(':')[1])).hour(parseInt(this.timeToWork.split(':')[0])).add(lunchMinutes, 'minutes');
    this.totalTime = total.format('HH:mm')
  }

  nativePicker(){
    this.datePicker.show({
      date: new Date(),
      mode: 'time',
      is24Hour: true,
      androidTheme: this.datePicker.ANDROID_THEMES.THEME_DEVICE_DEFAULT_LIGHT
    }).then(
      date => {
        let hourInPicker = moment(date);
        this.hourIn = hourInPicker.format('HH:mm');
        this.storage.set('hourIn', hourInPicker.format('HH:mm')).then((val) => {
          this.onTimeChange();
        });
      },
      err => console.log('Error occurred while getting date: ', err)
    );
  }

  calculate(){
    this.storage.set('hourIn', this.hourIn);

    let momentDate = moment();
    let out1 = momentDate.second(0).minute(parseInt(this.hourIn.split(':')[1])).hour(parseInt(this.hourIn.split(':')[0]));
    let lunchMinutes = (60 * (parseInt(this.lunchTime.split(':')[0]))) + (parseInt(this.lunchTime.split(':')[1]));
    let timeSpan = (60 * (parseInt(this.timeToWork.split(':')[0]))) + (parseInt(this.timeToWork.split(':')[1])) + lunchMinutes;
    let hourOut1local = out1.add(timeSpan, 'minutes').subtract(parseInt(this.tolerance.split(':')[1]), 'minutes');
    this.hourOut1 = hourOut1local.format('HH:mm');


    let now = moment();
    this.resetTimer(hourOut1local.diff(now, 'seconds'));

    let hourOutDateObject = hourOut1local.toDate();
    let out2 = momentDate.second(0).minute(parseInt(this.hourIn.split(':')[1])).hour(parseInt(this.hourIn.split(':')[0]));
    timeSpan = (60 * (parseInt(this.timeToWork.split(':')[0]))) + (parseInt(this.timeToWork.split(':')[1]));
    let hourOut2local = out2.add(timeSpan, 'minutes').add(parseInt(this.tolerance.split(':')[1]), 'minutes');
    this.hourOut2 = hourOut2local.format('HH:mm');
    this.localNotifications.cancelAll();

    this.storage.get('started').then((val) => {
        this.started = val || false;
        if(hourOutDateObject > new Date() && this.started){
          this.startTimer();
          this.started = true;
          this.storage.set('started', true);

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
      });
  }

  onTimeChange(){
    this.storage.set('started', true).then((val) => {
      this.started = true;
      this.calculate();
    });
    
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
    this.timer.resetTimer();
  }

  setTriggerEvent(){
    let vib = this.vibration;
    let alert = this.alertCtrl;
    let home = this;

    this.localNotifications.on('trigger', function(notification){ 
      setTimeout(() => vib.vibrate([2000,1000,2000,1000,2000]), 2000);
      let alertMessage = alert.create({
        title: 'Fim de Turno',
        subTitle: 'Hora de ir para casa.',
        buttons: [{
          text: 'OK',
          handler: () => {
            alertMessage.dismiss().then(() => { 
              vib.vibrate(0); 
              home.localNotifications.clearAll(); 
            });
            return false;
          }
        }]
      });
      alertMessage.present();
      home.clearNotification();
    });

    this.localNotifications.on('click', function(){
      vib.vibrate(0);
    });
  }

  clearNotification(){
    this.started = false;
    this.storage.set('started', false);
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
            this.storage.set('started', true).then((val) => {
              this.started = true;
              let momentDate = moment();
              this.hourIn = momentDate.format('HH:mm');
              this.calculate();
            });
            alert.present();
          }
        }
      ]
    });
    alert.present();
  }

  stopAll(){
    let alert = this.alertCtrl.create({
      title: 'Parar',
      message: 'Desativar notificação?',
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
            this.localNotifications.cancelAll();
            this.resetTimer(0);
            this.started = false;
            this.storage.set('started', false);
          }
        }
      ]
    });
    alert.present();
  }

}
