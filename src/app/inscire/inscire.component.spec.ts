import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InscireComponent } from './inscire.component';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { FormsModule } from '@angular/forms';

describe('InscireComponent', () => {
  let component: InscireComponent;
  let fixture: ComponentFixture<InscireComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ InscireComponent ],
      imports: [FormsModule, HttpClientTestingModule, RouterTestingModule],
      schemas: [NO_ERRORS_SCHEMA]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InscireComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
