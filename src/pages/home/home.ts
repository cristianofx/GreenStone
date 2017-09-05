import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';
import { AlertController } from 'ionic-angular';
import { Storage } from '@ionic/storage';
import * as moment from 'moment';

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {

  isDisabled = true;
  timeToWork: string;
  tolerance: string;
  hourIn: string;
  hourOut1: string = '';
  hourOut2: string = '';

  constructor(public navCtrl: NavController, public alertCtrl: AlertController, public storage: Storage) {

    storage.get('timeToWork').then((val) => {
      this.timeToWork = val || '';
      storage.get('tolerance').then((val) => {
        this.tolerance = val || '';
        storage.get('standardInHour').then((val) => {
          this.hourIn = val || '';
          this.calculate();
        });
      });
    });

    this.hourIn = '08:00';

  }

  calculate(){
    console.log('The time is', this.hourIn);
    this.storage.set('hourIn', this.hourIn);

    let newDate = moment();

    let hour = this.hourIn.split(':')[0];
    let minute = this.hourIn.split(':')[1]

    let out1 = newDate.second(0).minute(parseInt(this.hourIn.split(':')[1])).hour(parseInt(this.hourIn.split(':')[0]));
    let timeSpan = (60 * (parseInt(this.timeToWork.split(':')[0]))) + (parseInt(this.timeToWork.split(':')[1]));

    let hourOut1local = out1.add(timeSpan, 'minutes').subtract(parseInt(this.tolerance.split(':')[1]), 'minutes');

    this.hourOut1 = hourOut1local.format('HH:mm');

    let out2 = newDate.second(0).minute(parseInt(this.hourIn.split(':')[1])).hour(parseInt(this.hourIn.split(':')[0]));
    timeSpan = (60 * (parseInt(this.timeToWork.split(':')[0]))) + (parseInt(this.timeToWork.split(':')[1]));

    let hourOut2local = out2.add(timeSpan, 'minutes').add(parseInt(this.tolerance.split(':')[1]), 'minutes');

    
    this.hourOut2 = hourOut2local.format('HH:mm');

  }

}
