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
    let has_three_cols = false;
    for (const line of lines) {
      const trimmed_line = line.trim();

      // ignore comments
      if (trimmed_line.startsWith('#')) { continue; }

      // ignore empty lines
      if (trimmed_line.length > 0) {
        const splitted_line = trimmed_line.split(/\s+/);
        has_three_cols = splitted_line.length >= 3;
        break;
      }
    }
    for (const line of lines) {
      const trimmed_line = line.trim();
      // ignore comments
      if (trimmed_line.startsWith('#')) { continue; }

      // split line at white-spaces or tabs
      const splitted_line = trimmed_line.split(/\s+/);

      if (splitted_line.length >= 2) {
        x.push(Number(splitted_line[0]));
        yData.push(Number(splitted_line[1]));
        if (has_three_cols) {
          if (splitted_line.length >= 3) {
            syData.push(Number(splitted_line[2]));
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
