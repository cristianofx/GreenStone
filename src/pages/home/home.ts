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
import { Platform } from 'ionic-angular';

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
              , private localNotifications: LocalNotifications, private vibration: Vibration, private datePicker: DatePicker, private platform: Platform) {

    let returnedAll = new CallbackReturnSemaphore();

    storage.get('timeToWork').then((val) => {
      this.timeToWork = val || '';
      returnedAll.timeToWork = true;
      if(returnedAll.isAllReturned())
        this.checkStarted();
    });

    storage.get('lunchTime').then((val) => {
      this.lunchTime = val || '';
      returnedAll.lunchTime = true;
      if(returnedAll.isAllReturned())
        this.checkStarted();
    });

    storage.get('tolerance').then((val) => {
      this.tolerance = val || '';
      returnedAll.tolerance = true;
      if(returnedAll.isAllReturned())
        this.checkStarted();
    });

    storage.get('hourIn').then((val) => {
      this.hourIn = val || '';
      returnedAll.hourIn = true;
      if(returnedAll.isAllReturned())
        this.checkStarted();
    });

    storage.get('navigation').then((val) => {
      if(!val){
        this.storage.set('navigation', true).then(() => {
          this.setTriggerEvent();
          this.setResumePauseEvents();
        });
      }
    });
  }

  ionViewDidLoad() {
    //view load event
  }

  ngOnInit() { 
    //android lifecycle hook
  }

  setResumePauseEvents() { 
    this.platform.ready().then(() => {
      let store = this.storage;
      this.platform.pause.subscribe(() => {
        store.set('navigation', false)
      });
      this.platform.resume.subscribe(() => {
        this.checkStarted();
      });
    });
  }

  ngOnDestroy() {
    //android lifecycle hook
  }

  goToConfig(){
    this.navCtrl.setRoot(ConfigPage);
  }

  checkStarted(){
    let store = this.storage;
    store.get('started').then((val) => {
      this.started = val || false;
      this.lastCallBackReceived = true;
      this.calculate();
    });
  }

  setTotalTime(){
    if(this.timeToWork != '' && this.lunchTime != ''){
      let lunchMinutes = (60 * (parseInt(this.lunchTime.split(':')[0]))) + (parseInt(this.lunchTime.split(':')[1]));
      let momentDate = moment();
      let total = momentDate.second(0).minute(parseInt(this.timeToWork.split(':')[1])).hour(parseInt(this.timeToWork.split(':')[0])).add(lunchMinutes, 'minutes');
      this.totalTime = total.format('HH:mm')
    }
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
    this.setTotalTime();
    this.storage.set('hourIn', this.hourIn);

    let momentDate = moment();
    let out1 = momentDate.second(0).minute(parseInt(this.hourIn.split(':')[1])).hour(parseInt(this.hourIn.split(':')[0]));
    let lunchMinutes = (60 * (parseInt(this.lunchTime.split(':')[0]))) + (parseInt(this.lunchTime.split(':')[1]));
    let timeSpan = (60 * (parseInt(this.timeToWork.split(':')[0]))) + (parseInt(this.timeToWork.split(':')[1])) + lunchMinutes;
    let toleranceCalculated = (60 * (parseInt(this.tolerance.split(':')[0]))) + (parseInt(this.tolerance.split(':')[1]));
    let hourOut1local = out1.add(timeSpan, 'minutes').subtract(toleranceCalculated, 'minutes');
    this.hourOut1 = hourOut1local.format('HH:mm');

    let now = moment();
    this.resetTimer(hourOut1local.diff(now, 'seconds'));

    let hourOutDateObject = hourOut1local.toDate();
    let out2 = momentDate.second(0).minute(parseInt(this.hourIn.split(':')[1])).hour(parseInt(this.hourIn.split(':')[0]));
    timeSpan = (60 * (parseInt(this.timeToWork.split(':')[0]))) + (parseInt(this.timeToWork.split(':')[1])) + lunchMinutes;
    let hourOut2local = out2.add(timeSpan, 'minutes').add(toleranceCalculated, 'minutes');
    this.hourOut2 = hourOut2local.format('HH:mm');
    this.localNotifications.cancelAll();

    this.storage.get('started').then((isStarted) => {
        if(hourOutDateObject > new Date() && isStarted){
          this.started = true;
          this.storage.set('started', true);
          this.startTimer();

          // Schedule delayed notification
          this.localNotifications.schedule({
            id: 1,
            text: 'Fim do turno',
            at: hourOutDateObject,
            led: 'FF0000',
            icon: "file://assets/icon/favicon.ico"
          });
        }
        else{
          this.schedulerStopped();
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
    var homeThis = this;

    this.localNotifications.on('trigger', function(notification){ 
      homeThis.schedulerStopped();
      this.started = false;
      homeThis.storage.set('started', false).then((val) => {
        this.started = false;
        homeThis["started"] = false;
        homeThis.started = false;
      });
      let alertMessage = alert.create({
        title: 'Fim de Turno',
        subTitle: 'Hora de ir para casa.',
        buttons: [{
          text: 'OK',
          handler: () => {
            alertMessage.dismiss().then(() => { 
              vib.vibrate(0); 
              this.started = false;
              homeThis.localNotifications.clearAll(); 
              homeThis.schedulerStopped();
              homeThis["started"] = false;
              homeThis.started = false;
            });
            return false;
          }
        }]
      });
      alertMessage.present();
      setTimeout(() => {
         vib.vibrate([2000,1000,2000,1000,2000]); 
      }, 1000);
      homeThis.schedulerStopped();
      this.started = false;
      homeThis.storage.set('started', false).then((val) => {
        this.started = false;
        homeThis["started"] = false;
        homeThis.started = false;
      });
    });

    this.localNotifications.on('click', function(){
      vib.vibrate(0);
    });
  }

  schedulerStopped(){
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

class CallbackReturnSemaphore {
  public timeToWork: boolean;
  public tolerance: boolean;
  public hourIn: boolean;
  public lunchTime: boolean;

  constructor() {
      
  }
  isAllReturned() {
      if(this.timeToWork && this.tolerance && this.hourIn && this.lunchTime)
        return true;
      else
        return false
  }
}
