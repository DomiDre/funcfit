import { Injectable } from '@angular/core';
import { XYEData } from '../models/xyedata.model';

class XYEFloatArrays {
  x: Float64Array;
  y: Float64Array;
  sy: Float64Array;
}

@Injectable({
  providedIn: 'root'
})
export class XydataLoaderService {

  constructor() { }

  parseColumnFileContent(content): XYEFloatArrays {
    const lines = String(content).split('\n');

    // initialize empty lists for the columns
    const x: number[] = [];
    const yData: number[] = [];
    const syData: number[] = [];

    // check lines for first non-empty line that's not a comment and see
    // if it has 2 or 3 columns
    let hasThreeColumns = false;
    for (const line of lines) {
      const trimmedLine = line.trim();

      // ignore comments
      if (trimmedLine.startsWith('#')) { continue; }

      // ignore empty lines
      if (trimmedLine.length > 0) {
        const splittedLine = trimmedLine.split(/\s+/);
        hasThreeColumns = splittedLine.length >= 3;
        break;
      }
    }
    for (const line of lines) {
      const trimmedLine = line.trim();
      // ignore comments
      if (trimmedLine.startsWith('#')) { continue; }

      // split line at white-spaces or tabs
      const splittedLine = trimmedLine.split(/\s+/);

      if (splittedLine.length >= 2) {
        x.push(Number(splittedLine[0]));
        yData.push(Number(splittedLine[1]));
        if (hasThreeColumns) {
          if (splittedLine.length >= 3) {
            syData.push(Number(splittedLine[2]));
          } else {
            throw new Error('File identified as 3 column file has one line with only 2 columns');
          }
        }
      }
    }
    return {
      x: new Float64Array(x),
      y: new Float64Array(yData),
      sy: new Float64Array(syData)
    };
  }

  readFile(filepath: Blob): Promise<XYEFloatArrays> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = event => {
        // read the data
        const content = reader.result;

        resolve(this.parseColumnFileContent(content));
      };

      reader.readAsText(filepath);
    });
  }
}
