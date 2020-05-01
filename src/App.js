import React, { Component } from 'react';
import Particles from 'react-particles-js'
import Navigation from './components/navigation/Navigation'
import Logo from './components/logo/Logo';
import ImageLinkForm from './components/imagelinkform/ImageLinkForm'
import Rank from './components/rank/Rank'
import FaceRecognition from './components/facerecognition/FaceRecognition'
import SignIn from './components/signin/SignIn'
import Register from './components/register/Register'
import Clarifai from 'clarifai'
import './App.css';
import 'tachyons';

const app = new Clarifai.App({
    apiKey: '351d71acc3244e31b4f7db92cf8d2641'
});

const particlesOptions = {  
    particles: {
        number: {
            value: 70,
            density: {
                enable: true,
                value_area: 700
            }
        }
    }
}

class App extends Component {
    constructor() {
        super()
        this.state = {
            input: '',
            imageUrl: '',
            boxes: [],
            route: 'signin',
            isSignedIn: false,
            user: {
                id: '',
                name: '',
                email: '',
                password: '',
                entries: 0,
                joined: ''
            }
        }
    }


loadUser = (data) => {
  this.setState({user: {
        id: data.id,
        name: data.name,
        email: data.email,
        entries: data.entries,
        joined: data.joined
    }})
}

onInputChange = (event) => {
   this.setState({ input: event.target.value })
}

calculateImageBox = (response) => {
    const coordinates = response.outputs[0].data.regions
    const image = document.getElementById('inputImage')

    const boxes = coordinates.map(({region_info}) => {
        return {
            topRow: region_info.bounding_box.top_row * Number(image.height),
            leftCol: region_info.bounding_box.left_col * Number(image.width),
            bottomRow: image.height - (region_info.bounding_box.bottom_row * Number(image.height)),
            rightCol: image.width - (region_info.bounding_box.right_col * Number(image.width))
        }        
    })

    return boxes
}

displayBox = (boxes) => {
    this.setState({ boxes: boxes})
}

// use input instead of imageUrl for .predict because of the way setState works
// or execute app.models.predict inside an anonymous callback function in setState
onButtonSubmit = () => {
    this.setState({ imageUrl: this.state.input }, () => {
        app.models
            .predict(
                Clarifai.FACE_DETECT_MODEL, 
                this.state.imageUrl)
            .then(response => {
                if (response) {
                    fetch('http://localhost:3001/image', {
                        method: 'put',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify({
                            id: this.state.user.id
                        })
                    })
                        .then(response => response.json())
                        .then(count => {
                            this.setState(Object.assign(this.state.user, { entries: count}))
                        }) 
                }

                this.displayBox(this.calculateImageBox(response))
            })
            .catch(error => console.log(error))    
        })
}
  
onRouteChange = (route) => {
    if(route === 'signout') {
       this.setState({ isSignedIn: false })
    } else if (route === 'home') {
       this.setState({ isSignedIn: true })
    }

    this.setState({ route: route })
}

render() {
    const { isSignedIn, route, boxes, imageUrl } = this.state

    return (
        <div className="App">
            <Particles
                className='particles'
                params={particlesOptions}
            />
            <Navigation 
                onRouteChange={this.onRouteChange}
                isSignedIn={isSignedIn}
            />

        {route === 'home' 
            ?
                (    
                <div> {/*Need to wrap multiple elements in div*/}
                    <Logo />
                    <Rank name={this.state.user.name} entries={this.state.user.entries}/>
                    <ImageLinkForm 
                        onInputChange={this.onInputChange}
                        onButtonSubmit={this.onButtonSubmit}
                    />
                    <FaceRecognition 
                        boxes={boxes} 
                        imageUrl={imageUrl}
                    />    
                </div>
                )
            :   
                (
                route==='signin'
                    ? <SignIn onRouteChange={this.onRouteChange} loadUser={this.loadUser}/>
                    : <Register onRouteChange={this.onRouteChange} loadUser={this.loadUser}/>
                )
            }
        </div>
        )
    }
}

export default App;