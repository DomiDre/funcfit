import { Component, OnInit, AfterViewInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { fader } from './animations';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  animations: [
    fader
  ]
})
export class AppComponent implements OnInit, AfterViewInit {

  constructor() {}

  ngOnInit() {
  }

  ngAfterViewInit(): void {
  }

  prepareRoute(outlet: RouterOutlet) {
    return outlet && outlet.activatedRouteData && outlet.activatedRouteData.animation;
  }
}
