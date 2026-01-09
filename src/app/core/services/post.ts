import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Post } from '../models/Post';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class PostService {

  constructor(private http: HttpClient) { }

  getPosts(): Observable<Post[]> {
    return this.http.get<Post[]>(environment.API_URL);
  }

  getPost(id: number): Observable<Post> {
    return this.http.get<Post>(`${environment.API_URL}/${id}`);
  }

}
