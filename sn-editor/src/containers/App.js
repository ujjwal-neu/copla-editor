
import React, { Component, useEffect, useState } from 'react';
import Dropzone from 'react-dropzone';
import queryString from 'query-string';
import EDF from 'components/EDF-View';
import EdfInfoBox from 'components/EdfInfoBox';
import Controls from 'components/Controls';
import Sidebar from 'components/Sidebar';
// import XNAT from 'components/Xnat';
import FileBrowser from 'components/FileBrowser';
import Bundle from 'utils/ResourceBundle';
import Papa from 'papaparse'
import AnnotationSelect from '../components/AnnotationSelect';
import Swal from 'sweetalert2';
import { connect } from 'react-redux';
import {addChanges, changeMode, noChanges} from '../redux/reducers/editorSlice'

// import PlotBands from '../dygraphs/plugins/plotbands';

 class App extends Component {

  newlabelRef = React.createRef(null)
  newcolorRef = React.createRef(null)
  edfViewRef = React.createRef()
  

  state = {
    bundles: [],
    activeBundle: null,
    showSidebar: true,
    loggedIn: false,
    isInfoboxVisible: false,
    markerData:[],
    annotationData:[],
    allLabels: [{label:"Bad",color:"#ff0000"},{label:"Good",color:"#00ff00"}],
    selectedLabel: {label:"Bad",color:"#ff0000"},
  }

  proxy = { onClick() {} }


  async componentDidMount() {
    const params = queryString.parse(window.location.search);
    const edf = params.edf;
    const artifacts = params.artifacts;
    if (edf) {
      const bundle = await new Bundle({ edf, artifacts }).load;
      this.setState({ bundles: [bundle], activeBundle: bundle });
    }
  }

  // componentDidUpdate(prevProps, prevState) {
  //   if (this.state.showSidebar !== prevState.showSidebar) { // was sidebar shown or hidden, trigger graph resize
  //     window.dispatchEvent(new Event('resize'));
  //   }
  // }

  onEdfDrop = async (files = []) => {
    const newBundles = await Promise.all(files
      .filter(file => file.name.endsWith('.edf'))
      .map((edf) => {
        const artifactsName = edf.name.replace(/\.edf$/, '-annotation.csv');
        const artifacts = files.find(file => file.name === artifactsName);
        return new Bundle({ edf, artifacts }).load;
      }));
      console.log(newBundles)
    const bundles = [...this.state.bundles, ...newBundles];


    if (bundles.length === 1 && !this.state.activeBundle) {
      this.setState({ bundles, activeBundle: bundles[0] });
    }
    else {
      this.setState({ bundles });
    }
  }

  rendermyfile= async (files=[])=>{
    const edf = new File([await (await fetch('/file.edf')).blob()], '/file.edf')
    const markerFile = await(await(fetch('/markers.csv'))).text()
    const annotationFile = await(await(fetch('/annotations.csv'))).text()

    // edf file specific
    const artifactsName = edf.name.replace(/\.edf$/, '-annotation.csv');
    // const artifacts = files.find(file => file.name === artifactsName);
    const newBundles = await new Bundle({ edf, artifactsName }).load;
 
    const bundles = [...this.state.bundles, newBundles];

    if (bundles.length === 1 && !this.state.activeBundle) {
      this.setState({ bundles, activeBundle: bundles[0] });
    }
    else {
      this.setState({ bundles });
    }
    
    const filesParser = ()=>{
      let md =[]
      let ad = []

    // annotations file specific
    Papa.parse(annotationFile,{
      header:false,
      delimiter:",",
      complete:(results)=>{
       ad = results.data.slice(1)
      }
    });

    // marker file specific
    Papa.parse(markerFile,{
      header: false,
      delimiter: ",",
      complete:(results)=>{
        md = results.data.slice(1)
      }
    });
    // console.log(md)

    this.setState({markerData:md,annotationData:ad})
  }
  filesParser()

  }


  renderfileoption (wrapperClass='',){
    return(
      <div className={wrapperClass}>
        <button onClick={this.rendermyfile}>click to load file</button>
      </div>
    )
  }

  handleLoginChange = (loggedIn) => {
    this.setState({ loggedIn });
  }

  handleSelect = (activeBundle) => {
    this.setState({ activeBundle });
  }

  // FUNCTIONS RELATED TO CHANGING MODES
  ChangeMode =  async (mode)=>{
    await this.detectEditingChange()
    if (this.props.isEditingChanges){
    Swal.fire({
      title: 'Do you want to save the changes?',
      showDenyButton: true,
      showCancelButton: true,
      confirmButtonText: 'Save',
      denyButtonText: `Don't save`,
    }).then((result) => {
      /* Read more about isConfirmed, isDenied below */
      if (result.isConfirmed) {
        // run the save to file functions here
        this.props.dispatch(changeMode(mode))
        this.props.dispatch(noChanges())
        this.saveBandChanges()
        this.nilchanges()
        this.discardBandChanges()
        this.rendermyfile();
        Swal.fire('Saved!', '', 'success')

      } else if (result.isDenied) {
        // discard the changes
        this.props.dispatch(noChanges())
        this.nilchanges()
        this.discardBandChanges()
        this.rendermyfile();
        this.props.dispatch(changeMode(mode))
        Swal.fire('Changes are not saved', '', 'info')
      }
    })
  }else{
    if(mode==='EDIT'){
      let _annoData = this.state.annotationData;
      this.setState({annotationData:[]})
      this.editableBands(_annoData)
      this.props.dispatch(changeMode(mode))
    }else if(mode === 'VIEW'){
      this.rendermyfile();
      this.props.dispatch(changeMode(mode))
    }
  }
}


  editChangesMade = (value)=>{
    this.setState({editChanges:value})
  }

  detectEditingChange = async ()=>{
    let result = this.edfViewRef.current.detectChangesMade()
    if (result===true){ this.props.dispatch(addChanges())}
  }


  saveBandChanges = ()=>{
    this.edfViewRef.current.saveBandChanges()
  }

  nilchanges = ()=>{
    this.edfViewRef.current.nilChanges();
  }

  discardBandChanges = ()=>{
    this.edfViewRef.current.discardBandChanges();
  }

  editableBands = (annoData)=>{
    this.edfViewRef.current.editableBands(annoData)
  }

  ////////////////////////// 



  handleUpload = (bundle) => {
    bundle.uploadStatus = 1; // destined
    this.setState({ bundles: this.state.bundles });
    // pseudonymisierung: ja / nein?
  } 

  handleUpdateStatus = (bundle, uploadStatus) => {
    bundle.uploadStatus = uploadStatus;
    this.setState({ bundles: this.state.bundles });
  }

  handleNewData = async (files) => {
    const bundle = await new Bundle(files).load;
    const bundles = [...this.state.bundles, bundle];
    return this.setState({ bundles });
  }

  handleNewAnnotation = async (file) => {
    const edfName = file.name.replace(/-annotation\.csv$/, '.edf')

    const bundles = await Promise.all(this.state.bundles.map(async bundle => {
      console.log(bundle.edf.file.name);
      if (bundle.edf.file.name === edfName) {
        return await new Bundle({edf: bundle.edf.file.file, artifacts: file}).load;
      } else {
        return bundle;
      }
    }));

    return this.setState({ bundles });
  }

  handleSidebarToggle = (showSidebar) => {
    this.setState({ showSidebar });
  }

  toggleInfobox = () => {
    const { isInfoboxVisible } = this.state;
    this.setState({ isInfoboxVisible: !isInfoboxVisible });
  };

  handleConfirm = ()=>{
    if (this.newlabelRef.current.value.trim() === "") return
    this.setState({allLabels: [...this.state.allLabels,{label: this.newlabelRef.current.value,color: this.newcolorRef.current.value}] })
    this.newlabelRef.current.value=""
}

findSetSelectedLabel = (label) => {
  let obj =  this.state.allLabels.find(obj => obj.label === label)
  // this.setSelectedLabel(obj)
  this.setState({selectedLabel: obj})
  }

  handleAddedEvents = (events) => {
    this.setState({ ...this.state, annotationData: [...this.state.annotationData, ...events] })
  }

  renderEditor() {
    const { edf, artifacts } = this.state.activeBundle || {};
    const sidebarWidth = this.props.mode ==='EDIT' ? '20rem' : '0rem';
    const uploadBundles = this.state.bundles.filter(b => b.uploadStatus);
    return (
      <div style={{ display: 'flex', maxWidth: '100%' }}>
      {this.props.mode === 'EDIT' && <Sidebar
        onToggle={this.handleSidebarToggle}
        showSidebar={this.state.showSidebar}
        width={sidebarWidth}
      >
        <FileBrowser
          bundles={this.state.bundles}
          canUpload={this.state.loggedIn}
          onSelect={this.handleSelect}
          onUpload={this.handleUpload}
        />
        <AnnotationSelect allLabels={this.state.allLabels} newlabelRef={this.newlabelRef} newcolorRef={this.newcolorRef} handleConfirm={this.handleConfirm} selectedLabel={this.selectedLabel} findSetSelectedLabel={this.findSetSelectedLabel} />
      </Sidebar>}
        <div className="edf-wrapper" style={{ maxWidth: `calc(100% - ${sidebarWidth})` }}>
          {edf
            ? <EDF ref={this.edfViewRef}  mode={this.props.mode} annotationData={this.state.annotationData} markerData={this.state.markerData} currentLabel={this.state.selectedLabel}  key={edf.file.name} edf={edf} artifacts={artifacts} controls={this.proxy} onNewAnnotation={this.handleNewAnnotation} allLabels={this.state.allLabels} state={this.state} handleAddedEvents={this.handleAddedEvents} />
            : <p className="alert alert-info">Select an EDF file to display it.</p>
          }
        </div>
      </div>
    );
  }

  render() {
    const { edf } = this.state.activeBundle || {};
    const hasBundle = this.state.bundles.length > 0;
    const hasActiveBundle = !!this.state.activeBundle;
    const containerClass = `container ${hasBundle ? 'full-width' : ''}`;
    const isInfoboxVisible = this.state.isInfoboxVisible;

    return (
      <div className={containerClass}>
        <header className="site-header dashed-bottom">
          <h3 href="." className="site-title">Neu-editor</h3>
          {hasActiveBundle && (
            <nav>
              <Controls proxy={this.proxy} />
              <button
                className="btn btn-default btn-ghost"
                onClick={this.toggleInfobox}
                title="Zeige Dateiinfos"
              >
                 <span role="img" aria-label="Zeige">ℹ️️</span>
              </button>
             
              <select onChange={(e)=>this.ChangeMode(e.target.value)} value={this.props.mode}>
                <option value="VIEW" label='View' />
                <option value="EDIT" label='Edit' />
              </select>
            </nav>
          )}
         
        </header>

        <main className="site-main">
          {this.state.error &&
            <pre className="alert alert-error">{this.state.error.message}</pre>
          }

          {hasBundle
            ? this.renderEditor()
            : this.renderfileoption()
          }
        </main>


        {isInfoboxVisible && (
          <EdfInfoBox
            edf={edf}
            onClose={this.toggleInfobox}
          />
        )}
      </div>
    );
  }

}


const mapStateToProps = (state) => ({
  mode: state.editor.mode,
  isEditingChanges:state.editor.isEditingChanges
});

export default connect(mapStateToProps)(App);