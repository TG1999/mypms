const express=require('express');
const app=express();
var path= require('path');
const firebase=require('firebase-admin');
const Fire=require('firebase');
const cookieparser=require('cookie-parser');
const sha256=require('sha256');
app.use(cookieparser());
const md5=require('md5');
const str_tr=md5('true');
var config = {
    apiKey: "AIzaSyCEPqtQmRNqutdf7a97GnTKurs9eVrSC20",
    authDomain: "mypms-c8f2b.firebaseapp.com",
    databaseURL: "https://mypms-c8f2b.firebaseio.com",
    projectId: "mypms-c8f2b",
    storageBucket: "mypms-c8f2b.appspot.com",
    messagingSenderId: "137305551681"
  };
  Fire.initializeApp(config);
  firebase.initializeApp({
    databaseURL:"https://mypms-c8f2b.firebaseio.com",
    credential:firebase.credential.cert('mypms_cred.json')
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
    firebase.database().ref('/User/'+sha256(Fire.auth().currentUser.providerData[0].email)).once('value',(snapshot,err)=>{
        var user=snapshot.val();
        var flag=true;
        if(user)
        {
            if(user.userType=='Admin')
            {
                res.cookie('hash',user.companyHash)
                res.cookie('flag',str_tr)
                res.cookie('companyName',user.companyName)
                res.cookie('userName',user.name)
                res.cookie('emailid',user.emailId)
                flag=false;
                res.redirect('/dashboard')  
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
            if(each.userType==='SiteLeader'&&!(each.siteId)){
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
})
app.post('/append',(req,res)=>{
    console.log('/append');
    let countofmaterial=req.body.n_boq;
    let countoftask=req.body.n_task;
    let countofsites=req.body.n_site;
    let projectId=req.body.project;
    console.log(JSON.stringify(req.body));
    flag=false;
    if(countofsites==1){
    	let timestamp = new Date();
    	var month = timestamp.getMonth() + 1;
    	timestamp =  timestamp.getDate()+"-"+month+"-"+timestamp.getFullYear()+"-"+timestamp.getTime();
        site={
            endDate:req.body.end_site,
            location:req.body.name_site,
            siteId: timestamp,
            siteLeader:req.body.leader_site,
            siteMaterialStatus:0,
            siteWorkStatus:0,
            startDate:req.body.start_site
        }
        if (!(req.body.name_site==="")&&(req.body.end_site)&&(req.body.name_site)&&(req.body.leader_site)&&(req.body.start_site)){
            {console.log('sites');
            firebase.database().ref('/User/'+sha256(site.siteLeader)).on('value',(snapshot,err)=>{
                var usr=snapshot.val();
                usr.siteId=site.siteId;
                firebase.database().ref('/User').child(sha256(site.siteLeader)).set(usr);
            })}
       if(!(firebase.database().ref(req.cookies.hash+'/Site').child(projectId).child(timestamp).set(site))){
            flag=true
       } 
        // firebase.database().ref('/User/'+req.body.leader_site.split('/')[1]).child('projectId').set(ref.key).then(()=>{
        // });
        }
    }
    else{
        for(i=0;i<countofsites;i++){
        	let timestamp = new Date();
    		var month = timestamp.getMonth() + 1;
    		timestamp =  timestamp.getDate()+"-"+month+"-"+timestamp.getFullYear()+"-"+timestamp.getTime();
            let sitesx={
                endDate:req.body.end_site[i],
                location:req.body.name_site[i],
                siteId: timestamp,
                siteLeader:req.body.leader_site[i],
                siteMaterialStatus:0,
                siteWorkStatus:0,
                startDate:req.body.start_site[i]
            }
            firebase.database().ref('/User/'+sha256(sitesx.siteLeader)).on('value',(snapshot,err)=>{
                var usr=snapshot.val();
                usr.siteId=timestamp;
                firebase.database().ref('/User').child(sha256(sitesx.siteLeader)).set(usr);
            
            if(!(firebase.database().ref(req.cookies.hash+'/Site').child(projectId).child(timestamp).set(sitesx))){
                flag=true;
            }
            })
            
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
    	let timestamp = new Date();
    	var month = timestamp.getMonth() + 1;
    	timestamp =  timestamp.getDate()+"-"+month+"-"+timestamp.getFullYear()+"-"+timestamp.getTime();
        task={
            projectId:projectId,
            taskCount:req.body.qty_task,
            taskCountDone:0,
            taskDescription:req.body.description_task,
            taskId: timestamp,
            taskName:req.body.name_task,
            unit:req.body.type_task,
            taskCountAssigned:0
        }
        if (!(req.body.name_task ==='')){
        if(!(firebase.database().ref(req.cookies.hash+'/ProjectTask').child(projectId).child(timestamp).set(task))){
            flag=true
        }
        }
    }
    else{
    for(i=0;i<countoftask;i++){
    	let timestamp = new Date();
    	var month = timestamp.getMonth() + 1;
    	timestamp =  timestamp.getDate()+"-"+month+"-"+timestamp.getFullYear()+"-"+timestamp.getTime();
        task={
            projectId:projectId,
            taskCount:req.body.qty_task[i],
            taskCountDone:0,
            taskDescription:req.body.description_task[i],
            taskId: timestamp,
            taskName:req.body.name_task[i],
            unit:req.body.type_task[i],
            taskCountAssigned:0
        }
        if(!(firebase.database().ref(req.cookies.hash+'/ProjectTask').child(projectId).child(timestamp).set(task))){
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
                    work=json.work;
                    material=json.material;
                    startDate=json.start;
                    datearray=startDate.split('/');
                    startDate = datearray[1] + '/' + datearray[0] + '/' + datearray[2];
                    startDate=new Date(startDate);
                    endDate=json.end;
                    datearray=endDate.split('/');
                    endDate = datearray[1] + '/' + datearray[0] + '/' + datearray[2];
                    endDate=new Date(endDate);
                    graph=[];
                    graph.push({
                        y:'Timeline',a:(endDate-startDate)/86400000,c:(Date.now()-startDate)/86400000
                    })
                    graph.push({
                        y:'WorkStatus',a:(endDate-startDate)/86400000,c:(endDate-startDate)/86400000*work
                    })
                    graph.push({
                        y:'MaterialStatus',a:(endDate-startDate)/86400000,c:(endDate-startDate)/86400000*material
                    })
                    id=each.projectId;
                    firebase.database().ref(req.cookies.hash+'/Site').once('value',(snapshot,err)=>{
                        taskgraph=[];
                        matgraph=[];
                        totalwork=0;
                        totalmaterial=0;
                        count=0;
                        if(snapshot.val()){
                            var sites=snapshot.val()[id];
                        
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
                            taskgraph.push({
                                y:each.location,
                                a:10,
                                c:each.siteWorkStatus*10
                            })
                            matgraph.push({
                                y:each.location,
                                a:10,
                                c:each.siteMaterialStatus*10
                            })
                            arr.push(jsn)
                        }

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
                	{console.log(json,taskgraph,matgraph);
                        taskgraph=JSON.stringify(taskgraph);
                        graph=JSON.stringify(graph);
                        matgraph=JSON.stringify(matgraph);
                        return res.render('project_landing.hbs',{data:json,arr:arr,count:count,brr:brr,crr:crr,project,taskgraph,matgraph,graph});
	                }else{
	                	console.log("crr: "+JSON.stringify(taskgraph));
	                    return res.render('project_landing.hbs',{data:json,arr:arr,count:count,err:req.query.err,brr:brr,crr:crr,project,taskgraph,matgraph,graph});
	                }
                     
                        
                    })
                  	
                	})
                   
                })
                

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
            json={emailId:emailId,
                name:name,
                phoneNumber:phone,
                userType:req.body.type,
                companyName:req.cookies.companyName,
                companyHash:req.cookies.hash}
        firebase.database().ref('/User').child(sha256(emailId)).set(json).then(()=>{
            res.redirect('/dashboard');
        })
        }
    );
})
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
    res.redirect('/dashboard')
})

app.post('/editProject',(req,res)=>{
    reditid=req.body.proid;
    firebase.database().ref(req.cookies.hash+'/Project/'+reditid).once('value',(snapshot,err)=>{
        var project=snapshot.val();
        console.log(task.taskName);
        project.endDate=req.body.endDate;
        project.location=req.body.location;
        project.startDate=req.body.startDate;
        project.projectManager=req.body.projectManager;
        task.unit=req.body.unit;
        firebase.database().ref(req.cookies.hash+'/Project/'+reditid).set(project);
    })
    
    res.redirect('/dashboard/viewproject?project='+reditid)
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
        // task.taskCountDone=req.body.donecount;
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
        // boq.procuredQuantity=req.body.procuredQuantity;
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
app.get('/profile',(req,res)=>{
    if(str_tr===req.cookies.flag){
        var name="";
		var emp="";
		var phn="";
        firebase.database().ref('/User/'+sha256(req.cookies.emailid)).on('value',(snapshot,err)=>{
            var usr=snapshot.val();
            name=usr.name;
            emp=usr.userType;
            phn=usr.phoneNumber;
            res.render('profile',{email:req.cookies.emailid,
                name,emp,phn})  
        })
    }
    else{
        return res.redirect('/login')
    }
})
app.get('/dashboard/viewsite',(req,res)=>{
    proid=req.query.project;
    siteid=req.query.site;
    arr=[];//Material array
    brr=[];//Task array
    console.log(siteid);
    console.log(req.cookies.hash);
    firebase.database().ref(req.cookies.hash+'/SiteMaterial/'+siteid).once('value',(snapshot,err)=>{
        sitemat=snapshot.val();
        console.log(sitemat);
        materialgraph=[];
        taskgraph=[];
        for(var key in sitemat){
            console.log(sitemat[key])
            arr.push(sitemat[key]);
            materialgraph.push({
                y:sitemat[key].materialName,a:sitemat[key].quantityIssued,c:sitemat[key].quantityConsumed
            })
        }
        console.log(arr);
        firebase.database().ref(req.cookies.hash+'/SiteTask/'+siteid).once('value',(snapshot,err)=>{
            sitetask=snapshot.val();
            console.log(sitetask);
            for(var key in sitetask){
                brr.push(sitetask[key]);
                taskgraph.push({
                    y:sitetask[key].taskName,a:sitetask[key].taskCount,c:sitetask[key].taskCountDone
                })
            }
            console.log(brr,arr);
            firebase.database().ref(req.cookies.hash+'/Site/'+proid+'/'+siteid).once('value',(snapshot,err)=>{
                sitedetails=snapshot.val();
                console.log(sitedetails);
                var startDate=sitedetails.startDate;
                var endDate=sitedetails.endDate;
                datearray=startDate.split('/');
                    startDate = datearray[1] + '/' + datearray[0] + '/' + datearray[2];
                    startDate=new Date(startDate);
                    datearray=endDate.split('/');
                    endDate = datearray[1] + '/' + datearray[0] + '/' + datearray[2];
                    endDate=new Date(endDate);
                    sitearr=[];
                    sitearr.push({
                        y:'Timeline',
                        a:(endDate-startDate)/86400000,
                        c:(Date.now()-startDate)/86400000
                    },
                {
                    y:'Material Status',
                    a:10,
                    c:sitedetails.siteMaterialStatus*10
                },
            {
                y:'Work Status',
                a:10,
                c:sitedetails.siteWorkStatus*10
            })
            sitearr=JSON.stringify(sitearr);
                    firebase.database().ref('/User').once('value',(snapshot,err)=>{  
                        if(err){
                            console.log(err);
                            return res.render('error-404.hbs');
                        }
                        if((snapshot.val())){
                            var user=snapshot.val();
                    var arr1=[];
                    for(var key in user){
                        var each=user[key];
                        if(each.userType==='SiteLeader'&&(!each.siteId)){
                            jsn={
                                id:each.emailId,
                                key:key
                            }
                            arr1.push(jsn);
                        }
                        }
                    
                    }
                    firebase.database().ref(req.cookies.hash+'/ProjectTask/'+proid).once('value',(snapshot,err)=>{  
				            if(err){
				                console.log(err);
				                return res.render('error-404.hbs');
				            }
				            if((snapshot.val())){
                                var projectTasks=snapshot.val();
                                var arrx=[];
                                for(var key in projectTasks){
                                     var each=projectTasks[key];
                                      jsn={
                                           taskId:each.taskId,
                                           taskName:each.taskName
                                           }
                                      arrx.push(jsn);
                                }   
				            }
                    res.render('site_landing.hbs',{material:arr,task:brr,proid,sitedetails:sitedetails,name:arr1,sitearr,projectTasks:arrx});    
                })
                })
            })   
        })
    })
})

app.post('/editSite',(req,res)=>{
    reditid=req.body.proid;
    reditid1=req.body.siteid;
    firebase.database().ref(req.cookies.hash+'/Site/'+reditid+'/'+reditid1).once('value',(snapshot,err)=>{
        var site=snapshot.val();
        site.endDate=req.body.endDate;
        site.location=req.body.location;
        site.startDate=req.body.startDate;
        site.siteLeader=req.body.siteLeader;
        firebase.database().ref('/User/'+sha256(req.body.siteLeaderold)).once('value',(snapshot,err)=>{
            user=snapshot.val();
            delete user.siteId;
            firebase.database().ref('/User/'+sha256(req.body.siteLeaderold)).set(user)
            // for(var key in user)
            // {
            //     eachuser=user[key];
            //     if(eachuser.emailId===)
            //     {
            //         uid=key;
            //         delete eachuser.siteId
            //         firebase.database().ref('/User/'+uid).set(eachuser);
            //     }
            // }
            // for(var key in user)
            // {
            //     eachuser=user[key];
            //     if(eachuser.emailId===req.body.siteLeader)
            //     {
            //         uid=key;
            //         eachuser.siteId=req.body.siteid;
            //         firebase.database().ref('/User/'+uid).set(eachuser);
            //     }
            // }
            firebase.database().ref('/User/'+sha256(req.body.siteLeader)).once('value',(snapshot,err)=>{
                user=snapshot.val();
                user.siteId=req.body.siteid;
                firebase.database().ref('/User/'+sha256(req.body.siteLeader)).set(user)
            })
        })
        firebase.database().ref(req.cookies.hash+'/Site/'+reditid+'/'+reditid1).set(site);
    })
    res.redirect('/dashboard/viewsite?project='+reditid+'&site='+reditid1);
})

app.post('/assignSiteTask',(req,res)=>{
    if(str_tr===req.cookies.flag){
    var project = req.body.project;
    var site = req.body.site;
    var taskId = req.body.taskId;
    var taskCount = req.body.taskCount;
    console.log("here is task Id: "+taskId)
   
    if(req.cookies.flag===str_tr){

        firebase.database().ref(req.cookies.hash+'/SiteTask/'+site+"/"+taskId).once('value',(snapshot,err)=>{
        	var zz=snapshot.val();
        	if (!zz){
			        firebase.database().ref(req.cookies.hash+'/ProjectTask/'+project+"/"+taskId).once('value',(snapshot,err)=>{  
			            if(err){
			                console.log(err);
			                return res.render('error-404.hbs');
			            }
			            if(!(snapshot.val())){
			                return res.render('error-404.hbs');
			            }
			        var projectTasks=snapshot.val();
			   		var tempjsn={};
			   		tempjsn.siteId=site;
			   		tempjsn.taskCount=taskCount;
			   		tempjsn.taskCountDone=0;
			   		tempjsn.taskid= taskId;
			   		tempjsn.taskName = projectTasks.taskName;
			   		firebase.database().ref(req.cookies.hash+'/SiteTask/'+site+'/'+taskId).set(tempjsn);
			    })}
			else{
				zz.taskCount=taskCount;
				firebase.database().ref(req.cookies.hash+'/SiteTask/'+site+'/'+taskId).set(zz);
			}
			res.redirect('/dashboard/viewsite?project='+project+"&site="+site);
     })

    }}
    else{
    res.redirect('/signout');}
})


app.listen(process.env.PORT||3000,()=>{
    console.log('http://localhost:3000')})
