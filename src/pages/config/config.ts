import { Component } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';
import { AlertController } from 'ionic-angular';
import { Storage } from '@ionic/storage';
import { HomePage } from "../home/home";

import { LocalNotifications } from '@ionic-native/local-notifications';


@Component({
  selector: 'config-list',
  templateUrl: 'config.html'
})
export class ConfigPage {
  selectedItem: any;
  icons: string[];
  items: Array<{title: string, note: string, icon: string}>;
  timeToWork: string;
  tolerance: string;
  standardInHour: string;

  constructor(public navCtrl: NavController, public navParams: NavParams, public alertCtrl: AlertController, 
              public storage: Storage, private localNotifications: LocalNotifications) {
    // If we navigated to this page, we will have an item available as a nav param
    this.selectedItem = navParams.get('item');

    // Let's populate this page with some filler content for funzies
    this.icons = ['flask', 'wifi', 'beer', 'football', 'basketball', 'paper-plane',
    'american-football', 'boat', 'bluetooth', 'build'];

    this.items = [];
    for (let i = 1; i < 11; i++) {
      this.items.push({
        title: 'Item ' + i,
        note: 'This is item #' + i,
        icon: this.icons[Math.floor(Math.random() * this.icons.length)]
      });
    }

    //storage.set('timeToWork', this.timeToWork);
    
      // Or to get a key/value pair
    // storage.get('age').then((val) => {
    //   console.log('Your age is', val);
    // });

    storage.get('timeToWork').then((val) => {
      this.timeToWork = val || '';
    });

    storage.get('tolerance').then((val) => {
      this.tolerance = val || '';
    });

    storage.get('standardInHour').then((val) => {
      this.standardInHour = val || '';
    });
  }



  itemTapped(event, item) {
    // That's right, we're pushing to ourselves!
    this.navCtrl.push(ConfigPage, {
      item: item
    });
  }

  save(){
    
  }

  showAlert() {

    this.storage.set('timeToWork', this.timeToWork);
    this.storage.set('tolerance', this.tolerance);
    this.storage.set('standardInHour', this.standardInHour);

    let alert = this.alertCtrl.create({
      title: 'Registrado',
      subTitle: 'Configuração salva',
      buttons: ['OK']
    });
    alert.present();

    this.navCtrl.setRoot(HomePage);

    this.storage.get('timeToWork').then((val) => {
      console.log('The time is', val);
    });
    
  }
}
