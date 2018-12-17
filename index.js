const express=require('express');
const app=express();
var path= require('path');
const firebase=require('firebase-admin');
const Fire=require('firebase');
const json2csv = require('json-2-csv');
const fs=require('fs')
var hbs = require('express-handlebars');
const cookieparser=require('cookie-parser');
app.use(cookieparser());
const md5=require('md5');
const str_tr=md5('true');
var config = {
    apiKey: "AIzaSyA17DwZnKRzasWV1LlX_I7MjphTizI7IX8",
    authDomain: "minor-5740d.firebaseapp.com",
    databaseURL: "https://minor-5740d.firebaseio.com",
    projectId: "minor-5740d",
    storageBucket: "minor-5740d.appspot.com",
    messagingSenderId: "785879673787"
  };
  Fire.initializeApp(config);
  firebase.initializeApp({
    databaseURL:"https://minor-5740d.firebaseio.com",
    credential:firebase.credential.cert('cred.json')
})


app.set('views', path.join(__dirname, 'views/'));
app.set('view engine','hbs');

app.use(express.urlencoded({extended:true}));
app.use(express.json());
app.get('/',(req,res)=>{
    res.redirect('/login')
})
app.use(express.static(path.join(__dirname,"/public_static")));

app.get('/login',(req,res)=>{
    if(req.cookies.flag===str_tr){
        res.redirect('/dashboard')
    }
    else{
    res.render('login.hbs');}
})

hash='';

app.get('/hello',(req,res)=>{
    firebase.database().ref('/User').once('value',(snapshot,err)=>{
        var users=snapshot.val();
        var flag=true;
        for(var key in users){
            each=users[key];
            flag=false;
            if(each.emailId==Fire.auth().currentUser.providerData[0].email&&(each.userType=='Admin')){
                hash=each.companyHash
                res.cookie('hash',hash)
                res.cookie('flag',str_tr)
                res.cookie('companyName',each.companyName)
                res.cookie('userName',each.name)
                console.log(hash)
                return res.redirect('/dashboard')
            }
        }
        if(flag)
        return res.redirect('/signout');
    })
})


app.post('/login',(req,res)=>{
    Fire.auth().signInWithEmailAndPassword(req.body.name,req.body.password).then(()=>res.redirect('/hello')).catch((err)=>{
res.redirect('/login')
})
})


app.get('/dashboard',(req,res)=>{
    if(req.cookies.flag===str_tr){
        firebase.database().ref(req.cookies.hash+'/Project').once('value',(snapshot,err)=>{
            if(err){
                console.log(err);
                return res.render('error-404.hbs');
            }
            if(!(snapshot.val())){
                return res.render('error-404.hbs');
            }
            var user=snapshot.val();
            var arr=[];
            var vs = [{color:"info"},{color:"purple"},{color:"danger"},{color:"success"}];
            var i=0;
            for(var key in user){
                var each=user[key];
                    jsn={
                        projectId:each.projectId,
                        projectName:each.projectName,
                        location:each.location,
                        projectManager:each.projectManager,
                        startDate:each.startDate,
                        endDate:each.endDate,
                        class:vs[i].color
                    }
                    arr.push(jsn);
                    if(i<3){i=i+1;}else{i=0}
            }
            // console.log(arr);
            return res.render('dashboard_ui.hbs',{data:arr});
            });
    }
    else{
        res.redirect('/login')
    }
})
app.get('/signout',(req,res)=>{
    Fire.auth().signOut();
    res.clearCookie('flag')
    res.clearCookie('hash')
    res.redirect('/login');
})
app.get('/dashboard/project',(req,res)=>{
    if(Fire.auth().currentUser){
        res.render('projectdash')
    }
    else{
        res.redirect('/login')
    }
})
app.get('/dashboard/addproject',(req,res)=>{
    if(Fire.auth().currentUser)
    {firebase.database().ref('/User').once('value',(snapshot,err)=>{     
        var user=snapshot.val();
        var arr=[];
        for(var key in user){
            var each=user[key];
            if(!each.projectId&&each.userType==='SiteLeader'){
                jsn={
                    id:each.emailId,
                    key:key
                }
                arr.push(jsn);
            }
        }
        res.render('project.hbs',{name:arr})
    })}
    else{
        res.redirect('/login')
    }
})
app.get('/dashboard/updateProject',(req,res)=>{
    if(str_tr===req.cookies.flag){
    var project = req.query.project;
    arr1=[{"projectId":project}];
    if(req.cookies.flag===str_tr){
        firebase.database().ref('/User').once('value',(snapshot,err)=>{  
            if(err){
                console.log(err);
                return res.render('error-404.hbs');
            }
            if(!(snapshot.val())){
                return res.render('error-404.hbs');
            }    
        var user=snapshot.val();
        var arr=[];
        for(var key in user){
            var each=user[key];
            if(!each.projectId&&each.userType==='SiteLeader'){
                jsn={
                    id:each.emailId,
                    key:key
                }
                arr.push(jsn);
            }
        }
        res.render('updateProject.hbs',{name:arr, projectdetails:arr1})
    })}}
    else{
    res.redirect('/signout');}
    // if(Fire.auth().currentUser){
    //     firebase.database().ref(hash+'/Project').once('value',(snapshot,err)=>{
    //         var arr=[];
    //         if(err){
    //             console.log(err);
    //             return res.render('error-404.hbs');
    //         }
    //         var user=snapshot.val();
    //         for (var key in user) {
    //             var each=user[key]
    //             arr.push(each.projectName)
    //           }
    //          return res.render('selectproject',{data:arr}); 
    //         })
    // }
    // else{
    //     return res.redirect('/login');
    // }
})
app.get('/dashboard/edit',(req,res)=>{
    if(Fire.auth().currentUser){
        firebase.database().ref(hash+'/Project').once('value',(snapshot,err)=>{
            var arr=[];
            if(err){
                console.log(err);
            }
            var user=snapshot.val();
            for (var key in user) {
                var each=user[key]
                arr.push(each.projectName)
              }
             return res.render('editproject',{data:arr}); 
            })
    }
    else{
        return res.redirect('/login');
    }
})
var editid="";
app.post('/dashboard/edit',(req,res)=>{
  firebase.database().ref(hash+'/Project').once('value',(snapshot,err)=>{
      var user=snapshot.val();
      for(var key in user){
          var each=user[key];
          if(each.projectName===req.body.project){
            editid=each.projectId;
            console.log(editid);
          }
      }
      {firebase.database().ref('/User').once('value',(snapshot,err)=>{     
        var user=snapshot.val();
        var arr=[];
        for(var key in user){
            var each=user[key];
            if(!each.projectId&&each.userType==='SiteLeader'){
                jsn={
                    id:each.emailId,
                    key:key
                }
                arr.push(jsn);
            }
        }
        res.render('appendform.hbs',{name:arr})
    })}
    })  
})
app.post('/append',(req,res)=>{
    console.log('/append');
    let countofmaterial=req.body.n_boq;
    let countoftask=req.body.n_task;
    let countofsites=req.body.n_site;
    let projectId=req.body.project;
    console.log(req.body);
    flag=false;
    if(countofsites==1){
        site={
            endDate:req.body.end_site,
            location:req.body.name_site,
            siteId:req.body.name_site,
            siteLeader:req.body.leader_site.split('/')[0],
            siteMaterialStatus:0,
            siteWorkStatus:0,
            startDate:req.body.start_site
        }
        if (!(req.body.name_site==="")&&(req.body.end_site)&&(req.body.name_site)&&(req.body.leader_site)&&(req.body.start_site)){
            console.log('sites');
       if(!(firebase.database().ref(req.cookies.hash+'/Site').child(projectId).child(req.body.name_site).set(site))){
            flag=true
       } 
        // firebase.database().ref('/User/'+req.body.leader_site.split('/')[1]).child('projectId').set(ref.key).then(()=>{
        // });
        }
    }
    else{
        for(i=0;i<countofsites;i++){
            site={
                endDate:req.body.end_site[i],
                location:req.body.name_site[i],
                siteId:req.body.name_site[i],
                siteLeader:req.body.leader_site[i].split('/')[0],
                siteMaterialStatus:0,
                siteWorkStatus:0,
                startDate:req.body.start_site[i]
            }
            if(!(firebase.database().ref(req.cookies.hash+'/Site').child(projectId).child(req.body.name_site[i]).set(site))){
                flag=true;
            }
            // firebase.database().ref('/User/'+req.body.leader_site[i].split('/')[1]).child('projectId').set(ref.key).then(()=>{
              
            // });
        }
    }
    if(countofmaterial==1){
        material={
            boqquantity:req.body.qty_boq,
            materialName:req.body.name_boq,
            procuredQuantity:0,
            unit:req.body.type_boq
        }
        console.log(material.unit);
        if (!(material.materialName ==='')&&(req.body.qty_boq)&&(req.body.name_boq)&&(req.body.type_boq)){
       if(!(firebase.database().ref(req.cookies.hash+'/ProjectMaterials').child(projectId).child(req.body.name_boq).set(material)))
       {
           flag=true;
       } 
        }
    }
    else{
        for(i=0;i<countofmaterial;i++){
            material={
                boqquantity:req.body.qty_boq[i],
                materialName:req.body.name_boq[i],
                procuredQuantity:0,
                unit:req.body.type_boq[i]
            }
            console.log(material.unit);
            if(!(firebase.database().ref(req.cookies.hash+'/ProjectMaterials').child(projectId).child(req.body.name_boq[i]).set(material)))
            {
                flag=true
            }
        }
    }
    if(countoftask==1){
        
        task={
            projectId:projectId,
            taskCount:req.body.qty_task,
            taskCountDone:0,
            taskDescription:req.body.description_task,
            taskId:req.body.name_task,
            taskName:req.body.name_task,
            unit:req.body.type_task,
            taskCountAssigned:0
        }
        if (!(req.body.name_task ==='')){
        if(!(firebase.database().ref(req.cookies.hash+'/ProjectTask').child(projectId).child(req.body.name_task).set(task))){
            flag=true
        }
        }
    }
    else{
    for(i=0;i<countoftask;i++){
        task={
            projectId:projectId,
            taskCount:req.body.qty_task[i],
            taskCountDone:0,
            taskDescription:req.body.description_task[i],
            taskId:req.body.name_task[i],
            taskName:req.body.name_task[i],
            unit:req.body.type_task[i],
            taskCountAssigned:0
        }
        if(!(firebase.database().ref(req.cookies.hash+'/ProjectTask').child(req.body.name_task[i]).set(task))){
            flag=true
        }
    }}
    if(flag)
    res.redirect('/dashboard/viewproject?project='+projectId+'?err=someproblemisthere')
    else
    res.redirect('/dashboard/viewproject?project='+projectId)
})
app.get("/dashboard/viewproject",(req,res)=>{
	var brr=[];
    var crr=[];
    if(str_tr===req.cookies.flag)
    {
        firebase.database().ref(req.cookies.hash+'/Project').once('value',(snapshot,err)=>{
            if(err){
                console.log(err);
                return res.render('error-404.hbs');
            }
            if(!(snapshot.val())){
                return res.render('error-404.hbs');
            }
            var arr=[];
            if(err){
                console.log(err);
            }
            var user=snapshot.val();
            for (var key in user) {
                var each=user[key]
                if(each.projectId===req.query.project)
                {var json={
                    proid:each.projectId,
                    start:each.startDate,
                    end:each.endDate,
                    loc:each.location,
                    work:each.workStatus,
                    material:each.materialStatus
                    }
                    id=each.projectId;
                    firebase.database().ref(req.cookies.hash+'/Site').once('value',(snapshot,err)=>{
                        
                        var sites=snapshot.val()[id];
                        totalwork=0;
                        totalmaterial=0;
                        count=0;
                        for(var key in sites)
                        {
                            count++;
                            var each=sites[key]
                            jsn={
                                proid:id,
                                loc:each.location,
                                id:key,
                                material:each.siteMaterialStatus,
                                work:each.siteWorkStatus,
                                leader:each.siteLeader,
                                startDate:each.startDate,
                                endDate:each.endDate
                            }
                            arr.push(jsn)
                        }
                        
                        console.log("json: "+ JSON.stringify(json));
                        console.log("array: "+JSON.stringify(arr));

                	firebase.database().ref(req.cookies.hash+'/ProjectMaterials/'+id).once('value',(snapshot,err)=>{
                    var mat=snapshot.val();
                    for(var key in mat){
                        brr.push(mat[key]);
                    }
                    console.log("mat: "+mat);

                    firebase.database().ref(req.cookies.hash+'/ProjectTask/'+id).once('value',(snapshot,err)=>{
                    var mat=snapshot.val();
                    for(var key in mat){
                        crr.push(mat[key]);
                    }
                  	console.log("taskarray: "+JSON.stringify(crr));
                    firebase.database().ref(req.cookies.hash+'/Project/'+id).once('value',(snapshot,err)=>{
                     console.log('Project:'+snapshot.val());
                     var project=snapshot.val();
                     console.log(project);
                     if(!(req.query.err))
                	{console.log("crr: "+JSON.stringify(crr));
                        return res.render('project_landing.hbs',{data:json,arr:arr,count:count,brr:brr,crr:crr,project});
	                }else{
	                	console.log("crr: "+JSON.stringify(crr));
	                    return res.render('project_landing.hbs',{data:json,arr:arr,count:count,err:req.query.err,brr:brr,crr:crr,project});
	                }   
                    })
                  	
                	})
                   
                })
                
                // firebase.database().ref(req.cookies.hash+'/Site/'+id).once('value',(snapshot,err)=>{
                //     var sites=snapshot.val();
                //     countme=0;
                //     for(var site in sites){
                //         firebase.database().ref(req.cookies.hash+'/SiteMaterial/'+site).once('value',(snapshot,err)=>{
                //             if(snapshot.val()){ 
                //             json2csv.json2csvPromisified(snapshot.val(), function(err, csv) {
                //                 if (err) console.log(err);
                //                 fs.writeFile('./public_static/spread_2.csv', csv, function(err) {
                //                   if (err) throw err;
                //                   console.log('cars file saved');
                //                 });
                //               });}
                //         })
                //         firebase.database().ref(req.cookies.hash+'/SiteTask/'+site).once('value',(snapshot,err)=>{
                //             if(snapshot.val()){
                //             json2csv.json2csvPromisified(snapshot.val(), function(err, csv) {
                //                 if (err) console.log(err);
                //                 fs.writeFile('./public_static/spread_3.csv', csv, function(err) {
                //                   if (err) throw err;
                //                   console.log('cars file saved');
                //                 });
                //               });}
                //         })
                //     }
                //     console.log(countme);
                // })

                    })
                }
              }
            })
    }
    else{
        res.redirect('/signout')
    }
})

app.post('/adduser',(req,res)=>{
    let name=req.body.name;
    let emailId=req.body.email;
    let pass=req.body.password;
    let phone=req.body.Phone;
    Fire.auth().createUserWithEmailAndPassword(emailId,pass).then(
        ()=>{
            var ref=firebase.database().ref('/User').push({
                emailId:emailId,
                name:name,
                phoneNumber:phone,
                userType:req.body.type,
                companyHash:req.cookies.hash
            }).then(()=>res.redirect('/dashboard'))
        }
    );
})
var proid="";
app.post('/addproject',(req,res)=>{
    let name=req.body.pname;
    let manager=req.body.manager;
    let location=req.body.location;
    let start=req.body.start;
    let end=req.body.end;
    var ref=firebase.database().ref(req.cookies.hash+'/Project').push();
    var key=ref.key;
    var data={
        endDate:end,
        location:location,
        materialStatus:0,
        projectId:key,
        projectManager:manager,
        projectName:name,
        startDate:start,
    workStatus:0
    }
    ref.set(data);
    // let countofmaterial=req.body.n_boq;
    // let countoftask=req.body.n_tasks;
    // let countofsites=req.body.n_site;
    // console.log(req.body.type_boq);
    // console.log(req.body.type_task);
    // if(countofsites==1){
    //     site={
    //         endDate:req.body.end_site,
    //         location:req.body.name_site,
    //         siteId:req.body.name_site,
    //         siteLeader:req.body.leader_site.split('/')[0],
    //         siteMaterialStatus:0,
    //         siteWorkStatus:0,
    //         startDate:req.body.start_site
    //     }
    //     firebase.database().ref(hash+'/Site').child(ref.key).child(req.body.name_site).set(site)
    //     // firebase.database().ref('/User/'+req.body.leader_site.split('/')[1]).child('projectId').set(ref.key).then(()=>{
            
    //     // });
    // }
    // else{
    //     for(i=0;i<countofsites;i++){
    //         site={
    //             endDate:req.body.end_site[i],
    //             location:req.body.name_site[i],
    //             siteId:req.body.name_site[i],
    //             siteLeader:req.body.leader_site[i].split('/')[0],
    //             siteMaterialStatus:0,
    //             siteWorkStatus:0,
    //             startDate:req.body.start_site[i]
    //         }
    //         firebase.database().ref(hash+'/Site').child(ref.key).child(req.body.name_site[i]).set(site)
    //         // firebase.database().ref('/User/'+req.body.leader_site[i].split('/')[1]).child('projectId').set(ref.key).then(()=>{
              
    //         // });
    //     }
    // }
    // if(countofmaterial==1){
    //     material={
    //         boqquantity:req.body.qty_boq,
    //         materialName:req.body.name_boq,
    //         procuredQuantity:0,
    //         projectId:ref.key,
    //         unit:req.body.type_boq
    //     }
    //     console.log(material.unit);
    //     firebase.database().ref(hash+'/ProjectMaterials').child(ref.key).child(req.body.name_boq).set(material)
    // }
    // else{
    //     for(i=0;i<countofmaterial;i++){
    //         material={
    //             boqquantity:req.body.qty_boq[i],
    //             materialName:req.body.name_boq[i],
    //             procuredQuantity:0,
    //             projectId:ref.key,
    //             unit:req.body.type_boq[i]
    //         }
    //         console.log(material.unit);
    //         firebase.database().ref(hash+'/ProjectMaterials').child(ref.key).child(req.body.name_boq[i]).set(material)
    //     }
    // }
    // if(countoftask==1){
    //     var rf=firebase.database().ref(hash+'/ProjectTask').child(ref.key).child(req.body.name_task).push();
    //     task={
    //         projectId:ref.key,
    //         taskCount:req.body.qty_task,
    //         taskCountDone:0,
    //         taskDescription:req.body.description_task,
    //         taskId:req.body.name_task,
    //         taskName:req.body.name_task,
    //         unit:req.body.type_task,
    //         taskCountAssigned:0
    //     }
    //     firebase.database().ref(hash+'/ProjectTask').child(ref.key).child(req.body.name_task).set(task);   
    // }
    // else{
    // for(i=0;i<countoftask;i++){
    //     var rf=firebase.database().ref(hash+'/ProjectTask').child(ref.key).child(req.body.name_task[i]).push();
    //     task={
    //         projectId:ref.key,
    //         taskCount:req.body.qty_task[i],
    //         taskCountDone:0,
    //         taskDescription:req.body.description_task[i],
    //         taskId:req.body.name_task[i],
    //         taskName:req.body.name_task[i],
    //         unit:req.body.type_task[i],
    //         taskCountAssigned:0
    //     }
    //     firebase.database().ref(hash+'/ProjectTask').child(ref.key).child(req.body.name_task[i]).set(task);
    // }}
    // proid=ref.key;
    // firebase.database().ref(hash+'/Site/'+proid).once('value',(snapshot,err)=>{
    //     sites=[];
    //     var site=snapshot.val();
    //     for(var key in site){
    //         var each=site[key];
    //         var json={
    //             location:each.location,
    //             id:each.siteId
    //         }
    //         sites.push(json);
    //     }
    // })
    res.redirect('/dashboard')
})
var siteid="";
app.get('/dashboard/details',(req,res)=>{
    if(Fire.auth().currentUser){
        firebase.database().ref(hash+'/Project').once('value',(snapshot,err)=>{
            var arr=[];
            if(err){
                console.log(err);
            }
            var user=snapshot.val();
            for (var key in user) {
                var each=user[key]
                arr.push(each.projectName)
              }
             return res.render('details',{data:arr}); 
            })
    }
    else{
        return res.redirect('/login');
    }  
})
proname="";
reditid=""
app.post('/dashboard/details',(req,res)=>{
    firebase.database().ref(hash+'/Project').once('value',(snapshot,err)=>{
        var user=snapshot.val();
        for(var key in user){
            var each=user[key];
            if(each.projectName===req.body.project){
              reditid=each.projectId;
            }
        }
    firebase.database().ref(hash+'/Project/'+reditid).once('value',(snapshot,err)=>{
        prodetails=snapshot.val();
        proname=prodetails.projectName
        res.render('details_form',{details:prodetails})
    })
      })  
  })
app.post('/dashboard/details/project',(req,res)=>{
    let name=proname;
    let manager=req.body.manager;
    let location=req.body.location;
    let start=req.body.start;
    let end=req.body.end;
    var data={
        endDate:end,
        location:location,
        materialStatus:0,
        projectId:reditid,
        projectManager:manager,
        projectName:name,
        startDate:start,
    workStatus:0
    }
    firebase.database().ref(hash+'/Project/'+reditid).set(data);
    res.render('dashboard');
})
app.get('/dashboard/details/material',(req,res)=>{
    firebase.database().ref(hash+'/ProjectMaterials/'+reditid).once('value',(snapshot,err)=>{
        var val=snapshot.val();
        console.log(val);
        var arr=[];
        for(var each in val){
            var task=val[each]
            json={
                taskName:task.materialName,
                taskId:task.materialName
            }
            arr.push(json);
        }
        res.render('material_view',{arr});
    })
})
app.get('/dashboard/details/site',(req,res)=>{
    firebase.database().ref(hash+'/Site/'+reditid).once('value',(snapshot,err)=>{
        var val=snapshot.val();
        console.log(val);
        var arr=[];
        for(var each in val){
            var task=val[each]
            json={
                taskName:task.location,
                taskId:task.siteId
            }
            arr.push(json);
        }
        res.render('site_view',{arr});
    })
})
app.get('/dashboard/details/task',(req,res)=>{
    firebase.database().ref(hash+'/ProjectTask/'+reditid).once('value',(snapshot,err)=>{
        var val=snapshot.val();
        console.log(val);
        var arr=[];
        for(var each in val){
            var task=val[each]
            json={
                taskName:task.taskName,
                taskId:task.taskId
            }
            arr.push(json);
        }
        res.render('task_view',{arr});
    })
})
task={};
taskid="";
app.post('/dashboard/details/task',(req,res)=>{
    let id=req.body.project;
    taskid=id;
    firebase.database().ref(hash+'/ProjectTask/'+reditid+'/'+id).once('value',(snapshot,err)=>{
        task=snapshot.val();
        res.render('task_form',{details:task})
    })
})
boqid="";
boq={};
app.post('/dashboard/details/material',(req,res)=>{
    let id=req.body.project;
    boqid=id;
    console.log(id);
    firebase.database().ref(hash+'/ProjectMaterials/'+reditid+'/'+id).once('value',(snapshot,err)=>{
        boq=snapshot.val();
        console.log(boq);
        res.render('boq_form',{details:boq});
    })
})
siteidnew="";
site={};
app.post('/dashboard/details/site',(req,res)=>{
    let id=req.body.project;
    siteidnew=id;
    console.log(id);
    firebase.database().ref(hash+'/Site/'+reditid+'/'+id).once('value',(snapshot,err)=>{
        site=snapshot.val();
        console.log(boq);
        res.render('site_form',{details:site});
    })
})
app.post('/editProjectTask',(req,res)=>{
    // task={};
    reditid=req.body.proid;
    taskid=req.body.taskid;
    console.log(taskid);
    firebase.database().ref(req.cookies.hash+'/ProjectTask/'+reditid+'/'+taskid).once('value',(snapshot,err)=>{
        var task=snapshot.val();
        console.log(task.taskName);
        task.taskDescription=req.body.taskdescription;
        task.taskCount=req.body.count;
        task.taskCountDone=req.body.donecount;
        task.unit=req.body.unit;
        firebase.database().ref(req.cookies.hash+'/ProjectTask/'+reditid+'/'+taskid).set(task);
        
    })
    
    res.redirect('/dashboard/viewproject?project='+reditid)
})
app.post('/editProjectMaterial',(req,res)=>{
    reditid=req.body.proid;
    boqid=req.body.materialName1;
    console.log(boqid);
    firebase.database().ref(req.cookies.hash+'/ProjectMaterials/'+reditid+'/'+boqid).once('value',(snapshot,err)=>{
        boq=snapshot.val();
        boq.boqquantity=req.body.boqquantity;
        boq.procuredQuantity=req.body.procuredQuantity;
        boq.unit=req.body.unit2;
        firebase.database().ref(req.cookies.hash+'/ProjectMaterials/'+reditid+'/'+boqid).set(boq);
    })
    res.redirect('/dashboard/viewproject?project='+reditid)
})
app.post('/edit/site',(req,res)=>{
    site.location=req.body.location;
    site.siteLeader=req.body.leader;
    site.endDate=req.body.end;
    site.startDate=req.body.start;
    firebase.database().ref(hash+'/ProjectTask/'+reditid+'/'+siteidnew).set(site);
    res.redirect('/dashboard');
})
app.post('/addtask',(req,res)=>{
siteid=req.body.project;
firebase.database().ref(hash+'/ProjectTask/'+proid).once('value',(snapshot,err)=>{
    var tasks=snapshot.val();
    arr=[];
    for(var key in tasks)
    {
        var task=tasks[key];
        var json={
            id:task.taskId,
            name:task.taskName,
            count:task.taskCount-task.taskCountAssigned,
            taskcount:task.taskCount,
            taskdone:task.taskCountAssigned
        }
        arr.push(json);
    }
    res.render('task',{data:arr});
})
})
app.post('/addtask1',(req,res)=>{
    siteid=req.body.project;
    firebase.database().ref(hash+'/ProjectTask/'+editid).once('value',(snapshot,err)=>{
        var tasks=snapshot.val();
        arr=[];
        for(var key in tasks)
        {
            var task=tasks[key];
            var json={
                id:task.taskId,
                name:task.taskName,
                count:task.taskCount-task.taskCountAssigned,
                taskcount:task.taskCount,
                taskdone:task.taskCountAssigned
            }
            arr.push(json);
        }
        res.render('task1',{data:arr});
    })
    })
app.post('/finaladd',(req,res)=>{
    let name=req.body.name;
    let qty=req.body.qty;
    let id=req.body.id;
    let length=name.length;
    let count=req.body.count;
    let done=req.body.done;
    console.log(length);
    flag=true;
    for(i=0;i<length;i++){
        if(done[i]+qty[i]<count[i])
            {
                flag=flag*true;
            }
            else{
                flag=flag*false;
            }
    }
    if(!flag){
        return res.send('SORRY WRONG VALUES ENETERD BY YOU');
    }else{
    for(i=0;i<length;i++){
        data={
            siteId:siteid,
            taskId:id[i],
            taskName:name[i],
            taskCountDone:0,
            taskCount:qty[i]
        }
        firebase.database().ref(hash+'/SiteTask').child(siteid).child(id[i]).set(data);
        firebase.database().ref(hash+'ProjectTask/'+proid+'/'+id[i]+'/taskCountAssigned').set(done[i]+qty[i]);
    }}
    firebase.database().ref(hash+'/Site/'+proid).once('value',(snapshot,err)=>{
        sites=[];
        var site=snapshot.val();
        for(var key in site){
            var each=site[key];
            var json={
                location:each.location,
                id:each.siteId
            }
            sites.push(json);
        }
        res.render('task_site',{sites:sites})
    })
})
app.post('/finaladd1',(req,res)=>{
    let name=req.body.name;
    let qty=req.body.qty;
    let id=req.body.id;
    let length=name.length;
    let count=req.body.count;
    let done=req.body.done;
    console.log(length);
    flag=true;
    for(i=0;i<length;i++){
        if(done[i]+qty[i]<count[i])
            {
                flag=flag*true;
            }
            else{
                flag=flag*false;
            }
    }
    if(!flag){
        return res.send('SORRY WRONG VALUES ENETERD BY YOU');
    }else{
    for(i=0;i<length;i++){
        data={
            siteId:siteid,
            taskId:id[i],
            taskName:name[i],
            taskCountDone:0,
            taskCount:qty[i]
        }
        firebase.database().ref(hash+'/SiteTask').child(siteid).child(id[i]).set(data);
        firebase.database().ref(hash+'/ProjectTask/'+editid+'/'+id[i]+'/taskCountAssigned').set(done[i]+qty[i]);
    }}
    firebase.database().ref(hash+'/Site/'+editid).once('value',(snapshot,err)=>{
        sites=[];
        var site=snapshot.val();
        for(var key in site){
            var each=site[key];
            var json={
                location:each.location,
                id:each.siteId
            }
            sites.push(json);
        }
        res.render('task_site1',{sites:sites})
    })
})
app.get('/dashboard/adduser',(req,res)=>{
    if(Fire.auth().currentUser)
    res.render("user.hbs");
    else
    res.redirect('/login');
})
app.post('/dashboard/viewproject/site',(req,res)=>{
    var id=req.body.site;
    console.log(id);
    firebase.database().ref(hash+'/Site/'+id).once('value',(snapshot,err)=>{     
        var site=snapshot.val();
        console.log(site);
        for(var key in site)
        {
            var each=site[key];
            if(typeof(each)=='string')
            {console.log('string');
            console.log(each);
            each = each.replace (/,/g, "");
            }
            site[key]=each;
        }
        console.log(site);
        json2csv.json2csvPromisified(site, function(err, csv) {
            if (err) console.log(err);
            fs.writeFile('./public_static/spread.csv',csv, function(err) {
              if (err) throw err;
              console.log('cars file saved');
            });
          });
        return res.render('siteview',{site:site});
    })
})
app.get('/profile',(req,res)=>{
    if(Fire.auth().currentUser){
        var name="";
var emp="";
var phn="";
    firebase.database().ref('/User').once('value',(snapshot,err)=>{
        var flag=false
        if(err){
            console.log(err);
        }
        var user=snapshot.val();
        for (var key in user) {
            var each=user[key]
            if(each.emailId===(Fire.auth().currentUser.providerData[0].email)){
                name=each.name;
                emp=each.userType;
                phn=each.phoneNumber;
            }
          }
          res.render('profile',{email:Fire.auth().currentUser.providerData[0].email,
        name,emp,phn})
    // res.send(`<h1>
    // Email:${}<br>
    // Name:${name}<br>
    // Emp Type:${emp}<br>
    // Phone No:${phn}
    // </h1>
    // `)
})
    }
    else{
        return res.redirect('/login')
    }
})
app.listen(process.env.PORT||3000,()=>{
    console.log('http://localhost:3000')})
