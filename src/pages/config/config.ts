import { Component } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';
import { AlertController } from 'ionic-angular';
import { Storage } from '@ionic/storage';
import { HomePage } from "../home/home";

import { DatePicker } from '@ionic-native/date-picker';
import * as moment from 'moment';


@Component({
  selector: 'config-list',
  templateUrl: 'config.html'
})
export class ConfigPage {
  selectedItem: any;
  icons: string[];
  items: Array<{title: string, note: string, icon: string}>;
  timeToWork: string = '';
  tolerance: string = '';
  lunchTime: string = '';

  constructor(public navCtrl: NavController, public navParams: NavParams, public alertCtrl: AlertController, 
              public storage: Storage, private datePicker: DatePicker) {

    this.storage.set('navigation', true);

    storage.get('timeToWork').then((val) => {
      this.timeToWork = val || '';
    });

    storage.get('lunchTime').then((val) => {
      this.lunchTime = val || '';
    });

    storage.get('tolerance').then((val) => {
      this.tolerance = val || '';
    });
  }

  showAlert() {

    if(this.timeToWork != '' && this.lunchTime != '' && this.tolerance != ''){

      this.storage.set('lunchTime', this.lunchTime);
      this.storage.set('timeToWork', this.timeToWork);
      this.storage.set('tolerance', this.tolerance);

      let alert = this.alertCtrl.create({
        title: 'Registrado',
        subTitle: 'Configuração salva',
        buttons: ['OK']
      });
      alert.present();

      this.navCtrl.setRoot(HomePage);
    }
    else{
      let alert = this.alertCtrl.create({
        title: '',
        subTitle: 'Por favor, preencha todos os campos.',
        buttons: ['OK']
      });
      alert.present();
    }
  }

  nativePicker(field: string){
    let parent = this;
    this.datePicker.show({
      date: new Date(),
      mode: 'time',
      is24Hour: true,
      androidTheme: this.datePicker.ANDROID_THEMES.THEME_DEVICE_DEFAULT_LIGHT
    }).then(
      date => {
        let hourInPicker = moment(date);
        let hour = hourInPicker.format('HH:mm');
        parent[field] = hour;
      },
      err => console.log('Error occurred while getting date: ', err)
    );
  }
}
