import React, { Component } from 'react'
import {ipcRenderer} from 'electron'
import axios from 'axios'

export default class Settings extends Component {
  constructor(props) {
    super(props)
    this.state = {
      agencies: [],
      routes: [],
      stops: [],
      currentAgency: null,
      currentRoute: null,
      currentStop: null,
    }
  }

  componentDidMount() {
    axios.get('http://restbus.info/api/agencies')
    .then((response) => {
      this.setState({agencies: response.data})
    })
    .catch((error) => {
      console.log(error);
    });
  }

  handleAgencyChanged(e) {
    let agencyId = e.target.value
    this.setState({currentAgency: agencyId, currentStop: null, currentRoute: null})
    axios.get('http://restbus.info/api/agencies/' + agencyId + "/routes")
    .then((response) => {
      this.setState({routes: response.data})
    })
    .catch((error) => {
      console.log(error);
    });
  }

  handleRouteChanged(e) {
    let routeId = e.target.value
    this.setState({currentRoute: routeId})
    axios.get('http://restbus.info/api/agencies/' + this.state.currentAgency + "/routes/" + routeId)
    .then((response) => {
      this.setState({stops: response.data.stops})
    })
    .catch((error) => {
      console.log(error);
    });
  }

  handleStopChanged(e) {
    this.setState({currentStop: e.target.value})
  }

  handleSubmit(event) {
    event.preventDefault();
    ipcRenderer.send('save-settings', {agency: this.state.currentAgency, route: this.state.currentRoute, stop: this.state.currentStop});
  }

  render() {
    return (
      <div className="window">
        <div className="window-content">
          <div className="pane-group">
            <div className="pane sidebar">
              <div className="padded-more">
                <form onSubmit={this.handleSubmit.bind(this)}>
                  <div className="form-group">
                    <strong>&nbsp;Agency</strong>
                    <select name="agency" className="form-control" disabled={this.state.agencies.length === 0} onChange={this.handleAgencyChanged.bind(this)} value={this.state.currentAgency || ""}>
                      {this.state.agencies.length === 0 && <option>Loading Agencies</option>}
                      {this.state.agencies.length !== 0 && <option>Choose an Agency</option>}
                      {this.state.agencies.map((agency) => {
                        return (<option value={agency.id} key={agency.id}>{agency.title}</option>)
                      })}
                    </select>
                  </div>
                  <div className="form-group">
                    <strong>&nbsp;Route</strong>
                    <select name="route" className="form-control" disabled={this.state.routes.length === 0} onChange={this.handleRouteChanged.bind(this)} value={this.state.currentRoute || ""}>
                      {this.state.routes.length !== 0 && <option>Choose a Route</option>}
                      {this.state.routes.map((route) => {
                        return (<option value={route.id} key={route.id}>{route.title}</option>)
                      })}
                    </select>
                  </div>
                  <div className="form-group">
                    <strong>&nbsp;Stop</strong>
                    <select name="stop" className="form-control" disabled={this.state.stops.length === 0} onChange={this.handleStopChanged.bind(this)} value={this.state.currentStop || ""}>
                      {this.state.stops.length !== 0 && <option>Choose a Stop</option>}
                      {this.state.stops.map((stop) => {
                        return (<option value={stop.id} key={stop.id}>{stop.title}</option>)
                      })}
                    </select>
                  </div>
                  <div className="form-actions" style={{textAlign: "center"}}>
                    <button type="submit" className="btn btn-form btn-primary">Save</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }
}
