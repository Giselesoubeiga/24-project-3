import React, { Component } from 'react';
import './style.css';
import Chart from '../Charts';
import API from '../../utils/API';
import html2canvas from "html2canvas";
import Axios from 'axios';
const pdfConverter = require("jspdf");


class ReportPage extends Component {

    state ={
      
        chartData: {
          communityID:'',
          communityName:'',
          labels: [],
          datasets: [
            {
              label: [],
              data: [],
              backgroundColor: ["#36A2EB","#FF6384" , "#FFCE56", "#6610f2", "#fd7e14", "#28a745", "#6f42c1"]
            }
          ]

        },
        formData:[],
        alert:''
    }
  
  componentDidMount() {
    this.GetDataForInputForm();
  }

  //getting Community Id from User Table
  GetDataForInputForm(){
     API.AllCommunity()
     .then((res) => {
     const newFormData = res.data.map(function (community) {
      return ({
        community: {
          name: community.name,
          id: community._id
        },
      });
    });
    

    this.setState({ formData: newFormData });

  }
 
  ).catch(err => console.log("This is the ERR", err));
 
}


  RenderChartByAgeBracket(res,communityID,communityName){
    let seniorCount=0;
    let youthCount=0;
    let adultCount=0;
    let parentCount=0;
    res.data.forEach(user=>{
      if(user.communityID._id===communityID){
        if (user.ageBracket=== "Senior"){
          seniorCount+=1
        }else if(user.ageBracket=== "Adult"){
          adultCount+=1
        }else if(user.ageBracket=== "Youth"){
          youthCount+=1
        }else {
          parentCount+=1
        }
      }
     
    
    })
    this.setState(
      {chartData: {
        communityID:communityID,
        communityName:communityName,
        labels: ["Senior","Youth","Adult","Parent"],
        datasets: [
          {
            label: ["AgeBracket"],
            data: [seniorCount, youthCount,adultCount,parentCount],
            backgroundColor:this.state.chartData.datasets[0].backgroundColor
           
          }
        ]
      }
      });

  }

  RenderChartByGender(res,communityID,communityName){
          let Male=0;
          let Female=0;
          res.data.forEach(user=>{
            if(user.communityID._id===communityID){
              if (user.gender=== "Male"){
                Male+=1;
              }else if(user.gender=== "Female"){
                Female+=1;
              }
            }
          })
          this.setState(
            {chartData: {
              communityID:communityID,
              communityName:communityName,
              labels: ["Male", "Female"],
              datasets: [
                {
                  label: ["Gender"],
                  data: [Male, Female],
                  backgroundColor:this.state.chartData.datasets[0].backgroundColor
                 
                }
              ]
  
            }
            });

        }
  RenderChartByAttendance(res, communityID, communityName){
    
    let communityResidents = res.data.filter(resident=>{ return communityID === resident.communityID._id }).length;
    let allResidents = 0;
    let residentsAttended =0 ;
    console.log(res);
    Axios.get("/api/event").then(events =>{
       events.data.forEach(event => {
        if(communityID === event.communityID._id){
          residentsAttended += event.usersAttended.length;
          allResidents += communityResidents;
        }
      })
      this.setState(
        {chartData: {
          communityID:communityID,
          communityName:communityName,
          labels: ["All Residents","Residents Attended"],
          datasets: [
            {
              label: ["attendance"],
              data: [allResidents,residentsAttended],
              backgroundColor:this.state.chartData.datasets[0].backgroundColor
             
            }
          ]
  
        }
        });
    })




  }
   
  // getting all users from database
  GetAllUsers = (communityID,category,communityName) => {
    
    API.AllUsers()
      .then((res) => {

            if(category==="ageBracket"){
              this.RenderChartByAgeBracket(res, communityID,communityName)
              
            }
            else if(category==="gender"){
              this.RenderChartByGender(res, communityID,communityName)
            }
            else if (category==="attendance"){
              this.RenderChartByAttendance(res,communityID, communityName)

            }

      })
      .catch(err => console.log("This is the ERR", err));
  }

  HandleReportBtn(e,name){
    e.preventDefault();
    let communityID=e.target[0].value;
    let communityName=e.target[0].name;
    let category=e.target[1].value;
    console.log("Community Name :",communityName);
    console.log("Community ID :",communityID);
    this.GetAllUsers(communityID,category,communityName);
    console.log("STATE",this.state)
  }
  HandleSaveChart(e){
    e.preventDefault();
    

    const chartData={
      category:this.state.chartData.datasets[0].label,
      communityID:this.state.chartData.communityID,
      data:this.state.chartData.datasets[0].data,
      labels:this.state.chartData.labels,
      backgroundColor:this.state.chartData.datasets[0].backgroundColor,
    }
   
    API.createChart(chartData).then((res)=>{
      console.log("CHART CREATED !",res)
      this.setState({alert:"success"})
    }).catch(err =>{

       console.log("This is the ERR", err);
        this.setState({alert:"error"})
    })

  }
  
 

  div2PDF = e => {
        // const but = e.target;
        // but.style.display = "none";
        let input = window.document.getElementsByClassName("div2PDF")[0];
        console.log(input);
        const inputCanvas = input.children[1];
        console.log(inputCanvas);
        html2canvas(inputCanvas,{ 
          windowWidth: 1000, 
          windowHeight: 1000,
          height:800,
          width:800
        }).then(canvas => {
            const img = canvas.toDataURL("image/png");
            const pdf = new pdfConverter("1", "pt");


            //fillText(text, x, y, maxWidth)
            pdf.setFontSize(30);
            pdf.text(240, 150, this.state.chartData.datasets[0].label);
            console.log(img);

            pdf.addImage(
                img,
                "png",
                100,
                200,
                800,
                800
            );
            pdf.save("chart.pdf");
            // but.style.display = "block";
        });
    };

  render() {
    
    let alert = "";
    if(this.state.alert==="error") {
         alert= <div className= "alert alert-danger" role="alert">
                   <p>Error!</p>
                   <p>First generate the form, then click on SAVE button!</p>
                </div>
        
    }
    else if(this.state.alert==="success"){
         alert= <div className="alert alert-success" role="alert">
             <h5>Success!</h5>
             <p>Chart Data Saved!</p>    
         </div>
    }
    else{console.log("Fill Out The Form and click on generate Report button .")}
    

   
    return (

      <form onSubmit={(e)=>this.HandleReportBtn(e)} className="wrapper mx-auto align-middle">
        <div id="reportTitle">
          <h1>Reports</h1>
        </div>
        <div className="form-group">
          <label htmlFor="exampleFormControlSelect1">Community</label>
          <select className="form-control" id="exampleFormControlSelect1" >
            <option>Choose ...</option>
            {this.state.formData.map((community,index)=>{
             
              return <option key={index} name={community.community.name} value={community.community.id}>{community.community.name}</option>
            })}
           
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="exampleFormControlSelect2">Category</label>
          <select className="form-control" id="exampleFormControlSelect2">
              
             <option selected disabled key="1" >Choose ...</option>
             <option key="2" value="ageBracket">AgeBracket</option>
             <option key="3"  value="gender">Gender</option>
             <option key="4"  value="attendance">Attendance</option>
            
            
          </select>
        </div>
        <button className="generate">Generate Report</button>
        <button className="save" onClick={(e)=>this.HandleSaveChart(e)}>Save Chart</button>
        <button className="download" onClick={(e)=> this.div2PDF(e)}>Download</button>

        <div className="wrapperTwo">
          <Chart id="chart" type="pie" label={this.state.chartData.datasets[0].label} data={this.state.chartData} />
          {/* <canvas id="myChart" width="300" height="300"> */}
          {/* <Chart/> */}
          {/* </canvas> */}
        </div>
        {alert}
      </form>
       
    )
  }
}


export default ReportPage;

// how to get our data into this chart
// make a call to database to get info we need
// make data look like out testData
