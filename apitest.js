
function addMessageList(msg) {
    
    
    
    var RecogResult = $("#KBList");
    RecogResult.append("<li>" + msg + "</li>");

    

}

function showKBArticle(target)
{
    MobileCRM.bridge.alert("OK: KB Article about to be shown" + target.id);
    MobileCRM.UI.FormManager.showEditDialog("knowledgearticle", target.id);
    
    //reloadData();
}

function onShowRelevantInfo()
{
    
    var p = {x:"", y:""};
    
    var ProductList = $("#ProductList");
    
    p.x = ProductList.val();
    p.y = ProductList.text();
    y = $("#ProductList option:selected").text();
    
    
    
    ProductList.append('<option value="GUID 1">Product 1</option>');
    ProductList.append('<option value="GUID 2">Product 2</option>');
    ProductList.append('<option value="GUID 3">Product 3</option>');
    
    
    var KBList = $("#KBList");
    var KBArticleId = $("#KBArticleId").val(); //for example KA-01079

    /*
    var props1 = "props 1";
    var props0 = "props 0";

    var a = document.createElement("a");
    a.href = "#";
    a.id = props0;
    a.appendChild(document.createTextNode(props1));
 
    var li = document.createElement("li");
    li.appendChild(a);
    ul = document.getElementById("KBList");

    //ul.appendChild(li);      
    KBList.append(li);                        
*/

    //TESTING
    //KBList.append("<li>I2CS</li>");
    //KBList.append("<li>Azure MXChip</li>");
    KBList.append('<li> <a href="#"> Particle Electron UBlox G350 </a></li>');
    // /TESTING


    if (KBList) {
        var xmlData = '<fetch version="1.0" output-format="xml-platform" mapping="logical" distinct="false"><entity name="knowledgearticle"><attribute name="articlepublicnumber" /><attribute name="knowledgearticleid" /><attribute name="title" /><attribute name="createdon" /><order attribute="articlepublicnumber" descending="false" /><filter type="and"><condition attribute="articlepublicnumber" operator="eq" value="' + KBArticleId + '"/></filter></entity></fetch>';
                    

        //KBList.empty();
        //KBList.append("<option>Select a product id that corresponds to image taken...</option>");

        
        
        MobileCRM.FetchXml.Fetch.executeFromXML(xmlData, function (result) {
                for (var i in result) 
                {
                    var props = result[i];
                    var Data = props[0] + ':' + props[1];

                    var a = document.createElement("a");
                    a.href = "#";
                    a.id = props[1];
                    a.addEventListener("click",
                        function (e) {
                            showKBArticle(e.target);
                            },
                        false);

                    a.appendChild(document.createTextNode(props[2]));

                    //KBList.appendChild(a);
                    //KBList.appendChild(document.createElement("li"));                  
                    
                    var li = document.createElement("li");
                    li.appendChild(a);
                    KBList.append(li);
                    
                }

            },
            function (err) {
                MobileCRM.bridge.alert("Error fetching KB Articles" + err);
            },
            null
        );
        
    }
/*

EXAMPLE

var entity = new MobileCRM.FetchXml.Entity("account");
//entity.addAttributes();
var linkEntity = entity.addLink("contact", "parentcustomerid", "accountid",
"inner");
linkEntity.addAttribute("contactid");
linkEntity.addAttribute("fullname");
entity.filter = new MobileCRM.FetchXml.Filter();
entity.filter.where("accountid", "eq", accountId);
var fetch = new MobileCRM.FetchXml.Fetch(entity);
fetch.execute(
"Array",
function (res) {
if (res && res.length > 0) {
for (var i in res) {
var contact = res[i];
try {
var a = document.createElement("a");
a.href = "#";
a.id = contact[0];
a.addEventListener("click",
function (e){
MobileCRM.UI.FormManager.showEditDialog("contact", e.target.id);
reloadData();
},
false);
a.appendChild(document.createTextNode(contact[1]));
data.appendChild(a);
data.appendChild(document.createElement("br"));
}
catch (err){
alert("Exception Error : \n\n" + err);
}
}
}
},function (err) {alert(err); });
}
function addAssociatedContact()
{
// Create reference for associated account
try{
var target = new MobileCRM.Reference("account", accountId);
var relationShip = new MobileCRM.Relationship("parentcustomerid", target,
null, null);
MobileCRM.UI.FormManager.showNewDialog("contact", relationShip);
// Show all associated contact at the begining;
reloadData();
} catch (err)
{
alert("Exception : " + err);
}
}
function reloadPage()
{
document.location.reload(true);
}
function reloadData()
{
OpenForm();
}

*/


}


