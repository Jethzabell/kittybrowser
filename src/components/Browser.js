import React, { Component } from 'react';
import { object } from 'prop-types';
import Web3 from 'web3';
import KittyCoreABI from '../contracts/KittyCoreABI.json';
import { CONTRACT_NAME, CONTRACT_ADDRESS } from '../config';
import '../css/browser.css'

const moment = require('moment');
const request = require('request');

/*

Input():

Do not accept (input > #maxOfKitties) 
trim() -> "  1   4 " -> "14"
IsNan() -> Only accepts numbers
If no input [state changed] you would not be able to click findKitty() -> btn disable.

Check two different ways if ID is > than #maxOfKitties;
attribute -> 'max' = {Max}
method -> parseInt(id, 10) > parseInt(Max,10)

API():

Handles:
Unable to connect to Crypto Kitty server
Unable to find the Kitty Picture -> like Kitty #222
Loading Image
      
#maxOfKitties requested from API
Get the images of the Kitties via API 
*/

//max #of Kitties
let Max = 1005700;

class Browser extends Component {
  constructor(){
    super();
    this.state = {
      id:"122",
      genes: "",
      generation: "",
      birthTime: "",
    };
  }
  
  //set/getKittyContract
  getContract = () => {
    const web3 = new Web3(window.web3.currentProvider);

    //Initialize the contract instance
    const kittyContract = new web3.eth.Contract(
      KittyCoreABI, // import the contracts's ABI and use it here
      CONTRACT_ADDRESS,
    );

    //Add the contract to the drizzle store
    this.context.drizzle.addContract({
      contractName: CONTRACT_NAME,
      web3Contract: kittyContract,
    });

    return kittyContract;
  }

  //calling getContract() and getMaxKitties() -> disable getKittyBtn
  componentDidMount = () => {
    this.getTheKitty();
    this.getMaxKitties();

    document.getElementById("getKittyBtn").disabled = true;
  }

  //when
  setNotFoundText = () => {
    document.getElementById("kittyIMG").src ='404.png';
    document.getElementById("generationSpan").innerHTML = "";
    document.getElementById("genesSpan").innerHTML = "";
    document.getElementById("bithTimeSpan").innerHTML = "";
  }

  //request to server response.total == max number of kitties.
  getMaxKitties = () => {
    request({
        url: 'https://api.cryptokitties.co/kitties',
        json: true
    }, (error, request, body) => {

        if(error){
            console.log('Unable to connect to Crypto Kitty server');
        }else if(request.rawHeaders[17] === 'text/html; charset=utf-8'){
            console.log('Unable to connect to Crypto Kitty server, error 404');
        }else if(body.total){ 
            Max = JSON.stringify(body.total, undefined, 2);
        }
    });
  }

  //get kitty image 
  getImage = (id) => {
    request({
        url: `https://api.cryptokitties.co/kitties/${id}`,
        json: true
    }, (error, request, body) => {
        if(error){
            console.log('Unable to connect to Crypto Kitty server');
            document.getElementById("kittyIMG").src ='404.png';
            this.setNotFoundText();
        }else if(body.status === undefined){
            console.log('Unable to find the Kitty Picture');
            document.getElementById("kittyIMG").src ='https://media.giphy.com/media/26xBIygOcC3bAWg3S/giphy.gif';
        }else if(body.id){
            document.getElementById("kittyIMG").src =body.image_url;
        }
      });
  }

  //ID = Math.floor(Math.random() * Max)
  getRandomKitty = () =>  {

    let kittyContract = this.getContract();

    //change image while getImage() request is complete
    document.getElementById("kittyIMG").src ='https://media.giphy.com/media/GWYs1fPHqjqI8/giphy.gif';

    let randomNumber = Math.floor(Math.random() * Max);

    this.getImage(randomNumber);

    document.getElementById("randomID").value = randomNumber;

    kittyContract.methods.getKitty(randomNumber).call().then((results) => {
      this.setState({
        id:results.id,
        genes: results.genes,
        generation: results.generation,
        birthTime: moment.unix(results.birthTime).format('MMMM DD YYYY')
      });
    });
   
  }

  //check if(id>Max) else getTheKitty
  getTheKitty = () =>  {
    let id = this.state.id;

    document.getElementById("getKittyBtn").disabled = true;

    //change image while getImage() request is complete
    document.getElementById("kittyIMG").src ='https://media.giphy.com/media/GWYs1fPHqjqI8/giphy.gif';

      let kittyContract = this.getContract();

      kittyContract.methods.getKitty(id).call().then((results) => {
        this.setState({
          id:results.id,
          genes: results.genes,
          generation: results.generation,
          birthTime: moment.unix(results.birthTime).format('MMMM DD YYYY')
        });
      });

      this.getImage(id);
  }

  eraseInputText = () => {
    document.getElementById("randomID").value ="";
  }

  //check ID -> trim(), isNan(), > Max
  checkIfInputIsNan = (id) => {
    if (isNaN(id)) 
    {
      this.setState(() => ({ id: "" }));
      this.setNotFoundText();
      alert("Must input numbers");
      return false;
    }else if(parseInt(id, 10) > parseInt(Max,10)){
      this.setState(() => ({ id: "" }));
      this.setNotFoundText();
      alert(`This ID(${id}) > #Kitties(${Max}) probided by the API`);
    }else {
      this.setState(() => ({ id: id.trim()}));
    }
  }
 
  //Set id State -> Check if input isNum
  onIdChange = (e) => {
    const id= e.target.value;
    
    //Check if input isNum
    this.checkIfInputIsNan(id);
    console.log(e);
    //enable getKittyBtn (was disable at getTheKitty() getRandomKitty()
    document.getElementById("getKittyBtn").disabled = false;
  };



  render() {
    return (
      <div>
        <h1>Kitty Browser</h1>
        <div>
          <p>Kitty ID: </p>
          <input
            id="randomID"
            type="text"
            placeholder="Enter ID"
            input="number"
            value={this.state.id}
            onChange={this.onIdChange}
          /><input onClick={this.eraseInputText} type="submit" value="X"></input>
          <button onClick={this.getTheKitty} id="getKittyBtn">Find Kitty</button>
          <button onClick={this.getRandomKitty}>Random Kitty</button>
        </div>
                
        <div className="row">
          <div className="column">
            <img id="kittyIMG" src="" alt="kittyImg" max = {Max} ></img>
          </div>
          <div className="column">
            <div>
              <label>Genes: </label>
              <span id="genesSpan">{ this.state.genes }</span> 
            </div>
            <div>
              <label >Generation: </label>
              <span id="generationSpan">{ this.state.generation }</span> 
            </div>
            <div>
              <label>Birth Time: </label>
              <span id="bithTimeSpan">{ this.state.birthTime }</span> 
            </div>
          </div>
        </div>
        
      </div>
    );
  }
}

Browser.contextTypes = {
  drizzle: object,
};

export default Browser;
